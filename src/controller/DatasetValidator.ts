import { InsightError } from "./IInsightFacade";
import { Section } from "./Section";
import * as JSZip from "jszip";

export class DatasetValidator {
	private static readonly OVERALL_YEAR = 1900;

	public validateId(id: string): void {
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

	public async extractSectionsFromZip(content: string): Promise<Section[]> {
		let zipData: Buffer;
		try {
			zipData = Buffer.from(content, "base64");
		} catch {
			throw new InsightError("Invalid base64 content");
		}

		let zip: any;
		try {
			zip = await JSZip.loadAsync(zipData);
		} catch {
			throw new InsightError("Invalid zip file");
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
			throw new InsightError("Dataset must contain a courses/ folder");
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
		} catch {
			return [];
		}
		return sections;
	}

	private hasAllRequiredFields(data: any): boolean {
		const requiredFields = [
			"Subject",
			"Course",
			"Professor",
			"Title",
			"id",
			"Avg",
			"Pass",
			"Fail",
			"Audit",
			"Year",
			"Section",
		];
		return requiredFields.every(
			(field) => data.hasOwnProperty(field) && data[field] !== undefined && data[field] !== null
		);
	}

	private createSection(data: any): Section {
		const year = data.Section === "overall" ? DatasetValidator.OVERALL_YEAR : Number(data.Year);
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
}
