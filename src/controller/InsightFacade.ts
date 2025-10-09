import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	ResultTooLargeError,
	NotFoundError,
} from "./IInsightFacade";
import * as fs from "fs-extra";
import * as path from "path";
import JSZip from "jszip";
import { QueryValidator } from "./QueryValidator";

interface Course {
	uuid: string;
	id: string;
	title: string;
	instructor: string;
	dept: string;
	year: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
}

export default class InsightFacade implements IInsightFacade {
	private static readonly MAX_RESULTS = 5000;
	private static readonly OVERALL_YEAR = 1900;
	private datasets = new Map<string, Course[]>();
	private dataDir = "./data";
	private validator = new QueryValidator();

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		this.validateDatasetId(id);
		this.validateDatasetKind(kind);

		await fs.ensureDir(this.dataDir);
		const filePath = path.join(this.dataDir, `${id}.json`);
		if (await fs.pathExists(filePath)) {
			throw new InsightError("Dataset already exists");
		}

		try {
			const courses = await this.processZipContent(content);
			await fs.writeJson(filePath, courses);
			this.datasets.set(id, courses);
			return await this.getExistingDatasetIds();
		} catch (error) {
			if (error instanceof InsightError) {
				throw error;
			}
			throw new InsightError("Failed to process dataset");
		}
	}

	public async removeDataset(id: string): Promise<string> {
		if (!id || id.includes("_") || id.trim() === "") {
			throw new InsightError("Invalid dataset id");
		}

		const filePath = path.join(this.dataDir, `${id}.json`);
		if (!(await fs.pathExists(filePath))) {
			throw new NotFoundError("Dataset not found");
		}

		await fs.remove(filePath);
		this.datasets.delete(id);
		return id;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const ids = await this.getExistingDatasetIds();
		const results: InsightDataset[] = [];

		for (const id of ids) {
			const data = await this.loadDataset(id);
			if (data) {
				results.push({
					id,
					kind: InsightDatasetKind.Sections,
					numRows: data.length,
				});
			}
		}

		return results;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			if (!query || typeof query !== "object" || Array.isArray(query)) {
				throw new InsightError("Query must be an object");
			}

			const q = query as Record<string, any>;
			this.validator.validateQueryStructure(q);

			const datasetId = this.extractDatasetId(q);
			if (!datasetId) {
				throw new InsightError("Query must reference exactly one dataset");
			}

			const dataset = await this.loadDataset(datasetId);
			if (!dataset) {
				throw new InsightError(`Dataset ${datasetId} not found`);
			}

			const filteredCourses = this.applyWhere(dataset, q.WHERE);
			const results = this.applyOptions(filteredCourses, q.OPTIONS);

			if (results.length > InsightFacade.MAX_RESULTS) {
				throw new ResultTooLargeError("Query result exceeds 5000 rows");
			}

			return results;
		} catch (error) {
			if (error instanceof ResultTooLargeError) {
				throw error;
			}
			if (error instanceof InsightError) {
				throw error;
			}
			throw new InsightError("Invalid query");
		}
	}

	private validateDatasetId(id: string): void {
		if (!id || id.includes("_") || id.trim() === "") {
			throw new InsightError("Invalid dataset id");
		}
	}

	private validateDatasetKind(kind: InsightDatasetKind): void {
		if (kind !== InsightDatasetKind.Sections) {
			throw new InsightError("Only sections datasets are supported");
		}
	}

	private async processZipContent(content: string): Promise<Course[]> {
		const zip = new JSZip();
		const zipData = await zip.loadAsync(content, { base64: true });
		const courses: Course[] = [];

		const filePromises = Object.entries(zipData.files)
			.filter(([filename, file]) => filename.startsWith("courses/") && !file.dir && filename !== "courses/")
			.map(async ([, file]) => {
				const fileContent = await file.async("text");
				return JSON.parse(fileContent);
			});

		const courseDataArray = await Promise.all(filePromises);
		courseDataArray.forEach((courseData) => {
			if (courseData.result && Array.isArray(courseData.result)) {
				courseData.result.forEach((section: any) => {
					if (this.isValidSection(section)) {
						courses.push(this.createCourse(section));
					}
				});
			}
		});

		if (courses.length === 0) {
			throw new InsightError("No valid sections found");
		}

		return courses;
	}

	private createCourse(section: any): Course {
		return {
			uuid: String(section.id),
			id: String(section.Course),
			title: String(section.Title),
			instructor: String(section.Professor),
			dept: String(section.Subject),
			year: section.Section === "overall" ? InsightFacade.OVERALL_YEAR : Number(section.Year),
			avg: Number(section.Avg),
			pass: Number(section.Pass),
			fail: Number(section.Fail),
			audit: Number(section.Audit),
		};
	}

	private isValidSection(section: any): boolean {
		return (
			section &&
			"id" in section &&
			"Course" in section &&
			"Title" in section &&
			"Professor" in section &&
			"Subject" in section &&
			"Year" in section &&
			"Avg" in section &&
			"Pass" in section &&
			"Fail" in section &&
			"Audit" in section
		);
	}

	private async getExistingDatasetIds(): Promise<string[]> {
		try {
			await fs.ensureDir(this.dataDir);
			const files = await fs.readdir(this.dataDir);
			return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
		} catch {
			return [];
		}
	}

	private extractDatasetId(query: Record<string, any>): string | null {
		const keys = new Set<string>();
		this.collectKeys(query, keys);
		const datasetIds = Array.from(keys)
			.map((k) => k.split("_")[0])
			.filter((id) => id);
		const uniqueIds = [...new Set(datasetIds)];
		return uniqueIds.length === 1 ? uniqueIds[0] : null;
	}

	private collectKeys(obj: any, keys: Set<string>): void {
		if (typeof obj === "string" && obj.includes("_")) {
			keys.add(obj);
		} else if (Array.isArray(obj)) {
			obj.forEach((item) => this.collectKeys(item, keys));
		} else if (obj && typeof obj === "object") {
			Object.values(obj).forEach((value) => this.collectKeys(value, keys));
		}
	}

	private async loadDataset(id: string): Promise<Course[] | null> {
		if (this.datasets.has(id)) {
			return this.datasets.get(id)!;
		}
		try {
			const filePath = path.join(this.dataDir, `${id}.json`);
			if (await fs.pathExists(filePath)) {
				const data = await fs.readJson(filePath);
				this.datasets.set(id, data);
				return data;
			}
		} catch {
			// File doesn't exist or can't be read
		}
		return null;
	}

	private applyWhere(dataset: Course[], where: any): Course[] {
		if (!where || Object.keys(where).length === 0) {
			return dataset;
		}
		return dataset.filter((course) => this.evaluateFilter(course, where));
	}

	private evaluateFilter(course: Course, filter: any): boolean {
		if (!filter || typeof filter !== "object") return true;

		const [key, value] = Object.entries(filter)[0];
		switch (key) {
			case "AND":
				return Array.isArray(value) && value.every((f) => this.evaluateFilter(course, f));
			case "OR":
				return Array.isArray(value) && value.some((f) => this.evaluateFilter(course, f));
			case "NOT":
				return !this.evaluateFilter(course, value);
			case "LT":
				return this.evaluateComparison(course, value, (a, b) => a < b);
			case "GT":
				return this.evaluateComparison(course, value, (a, b) => a > b);
			case "EQ":
				return this.evaluateComparison(course, value, (a, b) => a === b);
			case "IS":
				return this.evaluateStringComparison(course, value);
			default:
				return false;
		}
	}

	private evaluateComparison(course: Course, comparison: any, op: (a: number, b: number) => boolean): boolean {
		const [fieldKey, expectedValue] = Object.entries(comparison)[0];
		const field = this.getFieldFromKey(fieldKey as string);
		const courseValue = (course as any)[field];
		return typeof courseValue === "number" && op(courseValue, expectedValue as number);
	}

	private evaluateStringComparison(course: Course, comparison: any): boolean {
		const [fieldKey, pattern] = Object.entries(comparison)[0];
		const field = this.getFieldFromKey(fieldKey as string);
		const courseValue = (course as any)[field];
		if (typeof courseValue !== "string" || typeof pattern !== "string") return false;

		const startWild = pattern.startsWith("*");
		const endWild = pattern.endsWith("*");
		const cleanPattern = pattern.replace(/^\*|\*$/g, "");

		if (startWild && endWild) return courseValue.includes(cleanPattern);
		if (startWild) return courseValue.endsWith(cleanPattern);
		if (endWild) return courseValue.startsWith(cleanPattern);
		return courseValue === cleanPattern;
	}

	private getFieldFromKey(key: string): string {
		return key.split("_")[1];
	}

	private applyOptions(courses: Course[], options: any): InsightResult[] {
		const results: InsightResult[] = courses.map((course) => {
			const result: InsightResult = {};
			options.COLUMNS.forEach((col: string) => {
				const field = this.getFieldFromKey(col);
				result[col] = (course as any)[field];
			});
			return result;
		});

		if (options.ORDER) {
			const orderKey = options.ORDER;
			results.sort((a, b) => {
				const aVal = a[orderKey];
				const bVal = b[orderKey];
				if (typeof aVal === "number" && typeof bVal === "number") {
					return aVal - bVal;
				}
				return String(aVal).localeCompare(String(bVal));
			});
		}

		return results;
	}
}
