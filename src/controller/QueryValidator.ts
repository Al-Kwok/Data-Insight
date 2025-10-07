import { InsightError } from "./IInsightFacade";

// === START: Amazon Q Implementation ===
export class QueryValidator {
	public validateQueryStructure(q: Record<string, any>): void {
		if (!q.WHERE || !q.OPTIONS) {
			throw new InsightError("Query must have WHERE and OPTIONS");
		}
		const keys = Object.keys(q);
		if (keys.length !== 2 || !keys.includes("WHERE") || !keys.includes("OPTIONS")) {
			throw new InsightError("Query must have exactly WHERE and OPTIONS");
		}
		this.validateWhere(q.WHERE);
		this.validateOptions(q.OPTIONS);
	}

	private validateWhere(where: any): void {
		if (typeof where !== "object" || Array.isArray(where)) {
			throw new InsightError("WHERE must be an object");
		}
		if (Object.keys(where).length > 0) {
			this.validateFilter(where);
		}
	}

	private validateFilter(filter: any): void {
		if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
			throw new InsightError("Filter must be an object");
		}
		const keys = Object.keys(filter);
		if (keys.length !== 1) {
			throw new InsightError("Filter must have exactly one key");
		}
		const [key, value] = Object.entries(filter)[0];
		switch (key) {
			case "AND":
			case "OR":
				if (!Array.isArray(value) || value.length === 0) {
					throw new InsightError(`${key} must be a non-empty array`);
				}
				value.forEach((f: any) => this.validateFilter(f));
				break;
			case "NOT":
				if (Array.isArray(value)) {
					throw new InsightError("NOT cannot wrap an array");
				}
				this.validateFilter(value);
				break;
			case "LT":
			case "GT":
			case "EQ":
				this.validateMComparison(value);
				break;
			case "IS":
				this.validateSComparison(value);
				break;
			default:
				throw new InsightError(`Invalid filter key: ${key}`);
		}
	}

	private validateMComparison(comparison: any): void {
		if (!comparison || typeof comparison !== "object" || Array.isArray(comparison)) {
			throw new InsightError("Comparison must be an object");
		}
		const keys = Object.keys(comparison);
		if (keys.length !== 1) {
			throw new InsightError("Comparison must have exactly one key");
		}
		const [fieldKey, expectedValue] = Object.entries(comparison)[0];
		if (typeof expectedValue !== "number") {
			throw new InsightError("Comparison value must be a number");
		}
		this.validateKey(fieldKey, "mfield");
	}

	private validateSComparison(comparison: any): void {
		if (!comparison || typeof comparison !== "object" || Array.isArray(comparison)) {
			throw new InsightError("IS comparison must be an object");
		}
		const keys = Object.keys(comparison);
		if (keys.length !== 1) {
			throw new InsightError("IS comparison must have exactly one key");
		}
		const [fieldKey, pattern] = Object.entries(comparison)[0];
		if (typeof pattern !== "string") {
			throw new InsightError("IS comparison value must be a string");
		}
		this.validateWildcard(pattern);
		this.validateKey(fieldKey, "sfield");
	}

	private validateWildcard(pattern: string): void {
		const asteriskCount = (pattern.match(/\*/g) || []).length;
		if (asteriskCount > 2) {
			throw new InsightError("Too many asterisks in pattern");
		}
		if (asteriskCount === 2 && (!pattern.startsWith("*") || !pattern.endsWith("*"))) {
			throw new InsightError("Asterisks can only be at the beginning and/or end");
		}
		if (asteriskCount === 1 && !pattern.startsWith("*") && !pattern.endsWith("*")) {
			throw new InsightError("Asterisks can only be at the beginning and/or end");
		}
	}

	private validateKey(key: string, expectedType: "mfield" | "sfield"): void {
		if (!key.includes("_")) {
			throw new InsightError("Key must contain underscore");
		}
		const parts = key.split("_");
		if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
			throw new InsightError("Invalid key format");
		}
		const [, field] = parts;
		const mfields = ["avg", "pass", "fail", "audit", "year"];
		const sfields = ["dept", "id", "instructor", "title", "uuid"];
		if (expectedType === "mfield" && !mfields.includes(field)) {
			throw new InsightError(`Invalid mfield: ${field}`);
		}
		if (expectedType === "sfield" && !sfields.includes(field)) {
			throw new InsightError(`Invalid sfield: ${field}`);
		}
	}

	private validateOptions(options: any): void {
		if (!options || typeof options !== "object" || Array.isArray(options)) {
			throw new InsightError("OPTIONS must be an object");
		}
		if (!options.COLUMNS) {
			throw new InsightError("OPTIONS must have COLUMNS");
		}
		if (!Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
			throw new InsightError("COLUMNS must be a non-empty array");
		}
		options.COLUMNS.forEach((col: any) => {
			if (typeof col !== "string") {
				throw new InsightError("Column must be a string");
			}
			this.validateKey(col, this.getKeyType(col));
		});
		if (options.ORDER) {
			if (typeof options.ORDER !== "string") {
				throw new InsightError("ORDER must be a string");
			}
			if (!options.COLUMNS.includes(options.ORDER)) {
				throw new InsightError("ORDER key must be in COLUMNS");
			}
		}
	}

	private getKeyType(key: string): "mfield" | "sfield" {
		const field = key.split("_")[1];
		const mfields = ["avg", "pass", "fail", "audit", "year"];
		return mfields.includes(field) ? "mfield" : "sfield";
	}
}
// === END: Amazon Q Implementation ===
