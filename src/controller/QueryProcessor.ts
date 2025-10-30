import { Section } from "./Section";
import { Room } from "./Room";
import { InsightResult } from "./IInsightFacade";
import { Decimal } from "decimal.js";

export class QueryProcessor {
	public applyTransformations(items: (Section | Room)[], transformations: any): InsightResult[] {
		const groups = this.groupBy(items, transformations.GROUP);
		return this.applyAggregations(groups, transformations.APPLY, transformations.GROUP);
	}

	private groupBy(items: (Section | Room)[], groupKeys: string[]): Map<string, (Section | Room)[]> {
		const groups = new Map<string, (Section | Room)[]>();

		for (const item of items) {
			const groupKey = this.createGroupKey(item, groupKeys);
			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey)!.push(item);
		}

		return groups;
	}

	private createGroupKey(item: Section | Room, groupKeys: string[]): string {
		return groupKeys
			.map((key) => {
				const field = key.split("_")[1];
				return String((item as any)[field]);
			})
			.join("|");
	}

	private applyAggregations(
		groups: Map<string, (Section | Room)[]>,
		applyRules: any[],
		groupKeys: string[]
	): InsightResult[] {
		const results: InsightResult[] = [];

		for (const [groupKey, groupItems] of groups) {
			const result: InsightResult = {};

			// Add group key values
			const keyValues = groupKey.split("|");
			groupKeys.forEach((key, index) => {
				const field = key.split("_")[1];
				const value = keyValues[index];
				result[key] = this.parseValue(value, field);
			});

			// Apply aggregation rules
			applyRules.forEach((rule) => {
				const applyKey = Object.keys(rule)[0];
				const operation = Object.keys(rule[applyKey])[0];
				const targetKey = rule[applyKey][operation];
				const targetField = targetKey.split("_")[1];

				result[applyKey] = this.calculateAggregation(groupItems, operation, targetField);
			});

			results.push(result);
		}

		return results;
	}

	private parseValue(value: string, field: string): any {
		const numericFields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
		if (numericFields.includes(field)) {
			return Number(value);
		}
		return value;
	}

	private calculateAggregation(items: (Section | Room)[], operation: string, field: string): number {
		const values = items.map((item) => (item as any)[field]);

		switch (operation) {
			case "MAX":
				return Math.max(...values);
			case "MIN":
				return Math.min(...values);
			case "SUM":
				const sum = values.reduce((acc, val) => acc + val, 0);
				return Number(sum.toFixed(2));
			case "AVG":
				return this.calculateAverage(values);
			case "COUNT":
				return new Set(values).size;
			default:
				throw new Error(`Unknown operation: ${operation}`);
		}
	}

	private calculateAverage(values: number[]): number {
		let total = new Decimal(0);
		for (const value of values) {
			total = total.add(new Decimal(value));
		}
		const avg = total.toNumber() / values.length;
		return Number(avg.toFixed(2));
	}

	public applySorting(results: InsightResult[], order: any): InsightResult[] {
		if (!order) {
			return results;
		}

		if (typeof order === "string") {
			return this.sortByKey(results, order, "UP");
		}

		const { dir, keys } = order;
		return this.sortByMultipleKeys(results, keys, dir);
	}

	private sortByKey(results: InsightResult[], key: string, direction: string): InsightResult[] {
		return results.sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			const comparison = this.compareValues(aVal, bVal);
			return direction === "UP" ? comparison : -comparison;
		});
	}

	private sortByMultipleKeys(results: InsightResult[], keys: string[], direction: string): InsightResult[] {
		return results.sort((a, b) => {
			for (const key of keys) {
				const aVal = a[key];
				const bVal = b[key];
				const comparison = this.compareValues(aVal, bVal);
				if (comparison !== 0) {
					return direction === "UP" ? comparison : -comparison;
				}
			}
			return 0;
		});
	}

	private compareValues(a: any, b: any): number {
		if (typeof a === "number" && typeof b === "number") {
			return a - b;
		}
		return String(a).localeCompare(String(b));
	}
}
