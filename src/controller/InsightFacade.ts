import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import { Section } from "./Section";
import * as fs from "fs-extra";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: Map<string, Section[]>;
	private readonly persistDir: string = "./data";

	constructor() {
		this.datasets = new Map<string, Section[]>();
		this.loadPersistedDatasets();
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// validate ID
		this.validateId(id);

		// check for duplicate ID
		if (this.datasets.has(id)) {
			return Promise.reject(new InsightError(`Dataset with id '${id}' already exists`));
		}

		// Validate kind
		if (kind !== InsightDatasetKind.Sections) {
			return Promise.reject(new InsightError("only 'sections' kind is allowed"));
		}

		// Extract sections from zip file
		let sections: Section[];
		try {
			sections = await this.extractSectionsFromZip(content);
		} catch (error) {
			return Promise.reject(error);
		}

		// Validate at least one section exists
		if (sections.length === 0) {
			return Promise.reject(new InsightError("No valid sections found in dataset"));
		}

		// store in memory
		this.datasets.set(id, sections);

		// persist to disk
		try {
			await this.saveToDisk(id, sections);
		} catch (error) {
			this.datasets.delete(id);
			return Promise.reject(new InsightError(`Failed to presist dataset: ${error}`));
		}

		// return all dataset IDs
		return Promise.resolve(Array.from(this.datasets.keys()));
	}

	// addDataset helpers

	private validateId(id: string): void {
		if (id.length === 0) {
			throw new InsightError("ID cannot be empty");
		}
		if (id.trim().length === 0) {
			throw new InsightError("ID cannot be only whitespace");
		}
		if (id.includes("_")) {
			throw new InsightError("ID cannot contain underscores");
		}
	}

	private async extractSectionsFromZip(content: string): Promise<Section[]> {
		let zipData: Buffer;
		try {
			zipData = Buffer.from(content, "base64");
		} catch (error) {
			throw new InsightError("Invalid base64 content");
		}

		let zip: any;
		try {
			zip = await JSZip.loadAsync(zipData);
		} catch (error) {
			throw new InsightError("invalid zip file");
		}

		let hasCoursesFolder = false;
		const filePromises: Array<Promise<Section[]>> = [];

		zip.forEach((relativePath: string, file: JSZip.JSZipObject) => {
			if (relativePath.startsWith("courses/")) {
				hasCoursesFolder = true;

				if (!file.dir && relativePath !== "courses/") {
					const promise = file
						.async("text")
						.then((fileContent: string) => this.processCourseFile(fileContent))
						.catch(() => [] as Section[]);

					filePromises.push(promise);
				}
			}
		});

		if (!hasCoursesFolder) {
			throw new InsightError("Dataset much be contained in courses folder");
		}

		const sectionArrays = await Promise.all(filePromises);
		const allSections = sectionArrays.flat();

		return allSections;
	}

	private processCourseFile(fileContent: string): Section[] {
		const sections: Section[] = [];

		try {
			const jsonData = JSON.parse(fileContent);

			if (!jsonData.result || !Array.isArray(jsonData.result)) {
				return [];
			}

			for (const rawSection of jsonData.result) {
				if (this.hasAllRequiredFields(rawSection)) {
					sections.push(this.createSection(rawSection));
				}
			}
		} catch (error) {
			return [];
		}
		return sections;
	}

	// *** NOTE: will need to revise this code because not all section have all info below
	private hasAllRequiredFields(data: any): boolean {
		const requiredFields = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];

		return requiredFields.every(
			(field) => data.hasOwnProperty(field) && data[field] !== undefined && data[field] !== null
		);
	}

	private createSection(data: any): Section {
		const year = data.Section === "overall" ? 1900 : Number(data.Year);

		return {
			uuid: String(data.id),
			id: String(data.Course),
			title: String(data.Title),
			instructor: String(data.Professor),
			dept: String(data.Subject),
			year: year,
			avg: Number(data.Avg),
			pass: Number(data.Pass),
			fail: Number(data.Fail),
			audit: Number(data.Audit),
		};
	}

	private async saveToDisk(id: string, sections: Section[]): Promise<void> {
		await fs.ensureDir(this.persistDir);
		const filepath = `${this.persistDir}/${id}.json`;
		await fs.writeJSON(filepath, sections, { spaces: 2 });
	}

	private async loadPersistedDatasets(): Promise<void> {
		try {
			const exists = await fs.pathExists(this.persistDir);
			if (!exists) {
				return;
			}
			const files = await fs.readdir(this.persistDir);

			for (const file of files) {
				if (file.endsWith(".json")) {
					try {
						const filepath = `${this.persistDir}/${file}`;
						const sections: Section[] = await fs.readJSON(filepath);
						const datasetId = file.slice(0, -5);
						this.datasets.set(datasetId, sections);
					} catch (error) {}
				}
			}
		} catch (error) {
			// no action, start with empty dataset
		}
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
