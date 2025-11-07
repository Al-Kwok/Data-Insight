import { InsightError } from "./IInsightFacade";

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export class GeolocationService {
	private static readonly BASE_URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team127";
	private cache = new Map<string, { lat: number; lon: number }>();

	public async getGeolocation(address: string): Promise<{ lat: number; lon: number }> {
		if (this.cache.has(address)) {
			return this.cache.get(address)!;
		}

		const encodedAddress = encodeURIComponent(address);
		const url = `${GeolocationService.BASE_URL}/${encodedAddress}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new InsightError(`Geolocation request failed: ${response.status}`);
			}

			const data = (await response.json()) as GeoResponse;

			if (data.error) {
				throw new InsightError(`Geolocation error: ${data.error}`);
			}

			if (data.lat === undefined || data.lon === undefined) {
				throw new InsightError("Invalid geolocation response");
			}

			const result = { lat: data.lat, lon: data.lon };
			this.cache.set(address, result);
			return result;
		} catch (error) {
			if (error instanceof InsightError) {
				throw error;
			}
			throw new InsightError(`Geolocation service error: ${error}`);
		}
	}
}
