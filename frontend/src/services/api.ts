import { InsightDataset, InsightDatasetKind, InsightResult, ApiResponse, DepartmentInsight } from "./types";

const API_BASE_URL = `${process.env.REACT_APP_API_URL || ""}/api/v1`;

export class InsightFacadeAPI {
	async addDataset(id: string, file: File, kind: InsightDatasetKind = InsightDatasetKind.Sections): Promise<string[]> {
		const formData = new FormData();
		formData.append("file", file);

		// No Content-Type header — the browser sets it automatically with the multipart boundary
		const response = await fetch(`${API_BASE_URL}/datasets/${id}/${kind}`, {
			method: "PUT",
			body: formData,
		});

		let data: ApiResponse<string[]>;
		try {
			data = await response.json();
		} catch {
			throw new Error(
				`Server returned an invalid response (HTTP ${response.status}). ` +
				`The file may be too large or the server may be unavailable.`
			);
		}

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
