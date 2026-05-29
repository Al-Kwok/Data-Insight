export enum InsightDatasetKind {
	Sections = "sections",
}

export interface InsightDataset {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
}

export type InsightResult = Record<string, string | number>;

export interface ApiResponse<T> {
	result?: T;
	error?: string;
}

export interface CourseInsight {
	dept: string;
	id: string;
	title: string;
	enrollment: number;
	average: number;
}

export interface DepartmentInsight {
	dept: string;
	totalEnrollment: number;
	historicalAverage: number;
	topCourses: CourseInsight[];
	highestAverageCourses: CourseInsight[];
}
