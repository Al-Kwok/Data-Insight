import { InsightDataset, InsightDatasetKind, InsightResult, ApiResponse, DepartmentInsight } from "./types";

// Use relative URLs when served from the same origin (production)
// or proxy to localhost:3000 when in development (see vite.config.ts or package.json proxy)
const API_BASE_URL = "/api/v1";

export class InsightFacadeAPI {
	async addDataset(id: string, content: string): Promise<string[]> {
		const response = await fetch(`${API_BASE_URL}/datasets/${id}/${InsightDatasetKind.Sections}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ content }),
		});

		const data: ApiResponse<string[]> = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to add dataset");
		}

		return data.result || [];
	}

	async removeDataset(id: string): Promise<string> {
		const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
			method: "DELETE",
		});

		const data: ApiResponse<string> = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to remove dataset");
		}

		return data.result || "";
	}

	async listDatasets(): Promise<InsightDataset[]> {
		const response = await fetch(`${API_BASE_URL}/datasets`);
		const data: ApiResponse<InsightDataset[]> = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to list datasets");
		}

		return data.result || [];
	}

	async performQuery(query: any): Promise<InsightResult[]> {
		const response = await fetch(`${API_BASE_URL}/queries`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(query),
		});

		const data: ApiResponse<InsightResult[]> = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Query failed");
		}

		return data.result || [];
	}

	async generateInsights(id: string): Promise<DepartmentInsight[]> {
		const response = await fetch(`${API_BASE_URL}/insights/${id}`);
		const data: ApiResponse<DepartmentInsight[]> = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to generate insights");
		}

		return data.result || [];
	}
}

export const api = new InsightFacadeAPI();
