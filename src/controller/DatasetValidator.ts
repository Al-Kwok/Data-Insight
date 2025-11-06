import { InsightError } from "./IInsightFacade";
import { Section } from "./Section";
import { Room } from "./Room";
import { GeolocationService } from "./GeolocationService";
import * as JSZip from "jszip";
import * as parse5 from "parse5";

export class DatasetValidator {
	private static readonly OVERALL_YEAR = 1900;
	private geolocationService = new GeolocationService();

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

	public async extractRoomsFromZip(content: string): Promise<Room[]> {
		const zip = await this.loadZipFile(content);
		const buildings = await this.extractBuildingsFromIndex(zip);
		const rooms = await this.processAllBuildings(zip, buildings);

		if (rooms.length === 0) {
			throw new InsightError("No valid rooms found in dataset");
		}

		return rooms;
	}

	private async loadZipFile(content: string): Promise<any> {
		let zipData: Buffer;
		try {
			zipData = Buffer.from(content, "base64");
		} catch {
			throw new InsightError("Invalid base64 content");
		}

		try {
			return await JSZip.loadAsync(zipData);
		} catch {
			throw new InsightError("Invalid zip file");
		}
	}

	private async extractBuildingsFromIndex(
		zip: any
	): Promise<Array<{ fullname: string; shortname: string; address: string; href: string }>> {
		const indexFile = zip.file("index.htm");
		if (!indexFile) {
			throw new InsightError("No index.htm file found");
		}

		const indexContent = await indexFile.async("text");
		const buildings = this.parseIndexFile(indexContent);

		return buildings;
	}

	private async processAllBuildings(
		zip: any,
		buildings: Array<{ fullname: string; shortname: string; address: string; href: string }>
	): Promise<Room[]> {
		const roomPromises = buildings.map(async (building) => {
			try {
				const buildingFile = zip.file(building.href.replace("./", ""));
				if (!buildingFile) {
					return [];
				}

				const buildingContent = await buildingFile.async("text");
				const geolocation = await this.geolocationService.getGeolocation(building.address);
				return this.parseBuildingFile(buildingContent, building, geolocation);
			} catch {
				return [];
			}
		});

		const roomArrays = await Promise.all(roomPromises);
		return roomArrays.flat();
	}

	private parseIndexFile(
		content: string
	): Array<{ fullname: string; shortname: string; address: string; href: string }> {
		const document = parse5.parse(content);
		const tables = this.findElementsByTagName(document, "table");

		for (const table of tables) {
			if (this.isBuildingTable(table)) {
				return this.extractBuildingsFromTable(table);
			}
		}
		return [];
	}

	private isBuildingTable(table: any): boolean {
		const rows = this.findElementsByTagName(table, "tr");
		for (const row of rows) {
			const cells = this.findElementsByTagName(row, "td");

			const hasTitle = cells.some((cell) => this.hasClass(cell, "views-field-title"));
			const hasAddress = cells.some((cell) => this.hasClass(cell, "views-field-field-building-address"));
			const hasCode = cells.some((cell) => this.hasClass(cell, "views-field-field-building-code"));

			if (hasTitle && hasAddress && hasCode) {
				return true;
			}
		}
		return false;
	}

	private extractBuildingsFromTable(
		table: any
	): Array<{ fullname: string; shortname: string; address: string; href: string }> {
		const buildings: Array<{ fullname: string; shortname: string; address: string; href: string }> = [];
		const rows = this.findElementsByTagName(table, "tr");

		for (const row of rows) {
			const cells = this.findElementsByTagName(row, "td");

			if (cells.length === 0) continue; // Skip header row

			const titleCell = cells.find((cell) => this.hasClass(cell, "views-field-title"));
			const addressCell = cells.find((cell) => this.hasClass(cell, "views-field-field-building-address"));
			const codeCell = cells.find((cell) => this.hasClass(cell, "views-field-field-building-code"));

			if (titleCell && addressCell && codeCell) {
				const link = this.findElementsByTagName(titleCell, "a")[0];

				if (link?.attrs) {
					const href = link.attrs.find((attr: { name: string; value: string }) => attr.name === "href")?.value;
					const fullname = this.getTextContent(titleCell);
					const address = this.getTextContent(addressCell);
					const shortname = this.getTextContent(codeCell);

					if (href && fullname && address && shortname) {
						buildings.push({ fullname, shortname, address, href });
					}
				}
			}
		}
		return buildings;
	}

	private parseBuildingFile(content: string, building: any, geolocation: { lat: number; lon: number }): Room[] {
		const document = parse5.parse(content);
		const rooms: Room[] = [];
		const tables = this.findElementsByTagName(document, "table");

		for (const table of tables) {
			const tableRooms = this.extractRoomsFromTable(table, building, geolocation);
			rooms.push(...tableRooms);
		}

		return rooms;
	}

	private extractRoomsFromTable(table: any, building: any, geolocation: { lat: number; lon: number }): Room[] {
		const rooms: Room[] = [];
		const rows = this.findElementsByTagName(table, "tr");

		for (const row of rows) {
			const room = this.extractRoomFromRow(row, building, geolocation);
			if (room) {
				rooms.push(room);
			}
		}

		return rooms;
	}

	private extractRoomFromRow(row: any, building: any, geolocation: { lat: number; lon: number }): Room | null {
		const cells = this.findElementsByTagName(row, "td");

		const numberCell = cells.find((cell) => this.hasClass(cell, "views-field-field-room-number"));
		const capacityCell = cells.find((cell) => this.hasClass(cell, "views-field-field-room-capacity"));
		const typeCell = cells.find((cell) => this.hasClass(cell, "views-field-field-room-type"));
		const furnitureCell = cells.find((cell) => this.hasClass(cell, "views-field-field-room-furniture"));
		const hrefCell = cells.find((cell) => this.hasClass(cell, "views-field-nothing"));

		if (numberCell && capacityCell && typeCell && furnitureCell && hrefCell) {
			const number = this.getTextContent(numberCell);
			const seats = parseInt(this.getTextContent(capacityCell), 10);
			const type = this.getTextContent(typeCell);
			const furniture = this.getTextContent(furnitureCell);

			const link = this.findElementsByTagName(hrefCell, "a")[0];
			const href = link?.attrs?.find((attr: { name: string; value: string }) => attr.name === "href")?.value || "";

			if (number && !isNaN(seats) && type && furniture) {
				return {
					fullname: building.fullname,
					shortname: building.shortname,
					number,
					name: `${building.shortname}_${number}`,
					address: building.address,
					lat: geolocation.lat,
					lon: geolocation.lon,
					seats,
					type,
					furniture,
					href,
				};
			}
		}

		return null;
	}

	private findElementsByTagName(node: any, tagName: string): any[] {
		const elements: any[] = [];

		if (node.nodeName === tagName) {
			elements.push(node);
		}

		if (node.childNodes) {
			for (const child of node.childNodes) {
				elements.push(...this.findElementsByTagName(child, tagName));
			}
		}

		return elements;
	}

	private hasClass(element: any, className: string): boolean {
		if (!element.attrs) return false;

		const classAttr = element.attrs.find((attr: { name: string; value: string }) => attr.name === "class");
		if (!classAttr) return false;

		return classAttr.value.includes(className);
	}

	private getTextContent(element: any): string {
		let text = "";

		if (element.nodeName === "#text") {
			return element.value.trim();
		}

		if (element.childNodes) {
			for (const child of element.childNodes) {
				text += this.getTextContent(child);
			}
		}

		return text.trim();
	}
}
