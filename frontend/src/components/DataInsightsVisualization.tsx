import React from "react";
import { Card } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { DepartmentInsight } from "../services/types";

interface DataInsightsVisualizationProps {
	insights: DepartmentInsight[];
}

export const DataInsightsVisualization: React.FC<DataInsightsVisualizationProps> = ({ insights }) => {
	// Color palette - modern and vibrant (5 colors for up to 5 courses)
	const COURSE_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
	const DEPT_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b"];

	// Prepare data for top departments chart
	const departmentData = insights.map((insight) => ({
		dept: insight.dept,
		totalEnrollment: insight.totalEnrollment,
		historicalAverage: insight.historicalAverage,
	}));

	// Prepare data for top courses by enrollment (horizontal grouped bar chart)
	// Create one row per department with fields for each course
	const topCoursesData: any[] = insights.map((deptInsight) => {
		const row: any = {
			dept: deptInsight.dept.toUpperCase(),
		};

		// Add each course as a separate field
		deptInsight.topCourses.forEach((course, index) => {
			const courseNum = index + 1;
			row[`course${courseNum}`] = course.enrollment;
			row[`course${courseNum}_id`] = course.id.substring(0, 3);
			row[`course${courseNum}_title`] = course.title;
			row[`course${courseNum}_fullId`] = course.id;
		});

		return row;
	});

	// Get the maximum number of courses across all departments
	const maxCourses = Math.max(...insights.map((d) => d.topCourses.length));

	// Try a simpler approach first
	const allEnrollments: number[] = [];
	topCoursesData.forEach((row) => {
		for (let i = 1; i <= maxCourses; i++) {
			const enrollment = row[`course${i}`];
			if (enrollment !== undefined && enrollment !== null) {
				allEnrollments.push(enrollment);
			}
		}
	});

	const maxEnrollment = Math.max(...allEnrollments);

	// Debug logging
	console.log("[DEBUG] All enrollments:", allEnrollments);
	console.log("[DEBUG] maxEnrollment:", maxEnrollment);
	console.log("[DataInsights] topCoursesData:", topCoursesData);
	console.log("[DataInsights] maxCourses:", maxCourses);

	// Prepare data for highest average courses (horizontal grouped bar chart)
	// Create one row per department with fields for each course
	const highestAvgData: any[] = insights.map((deptInsight) => {
		const row: any = {
			dept: deptInsight.dept.toUpperCase(),
		};

		// Add each course as a separate field
		deptInsight.highestAverageCourses.forEach((course, index) => {
			const courseNum = index + 1;
			row[`course${courseNum}`] = course.average;
			row[`course${courseNum}_id`] = course.id.substring(0, 3);
			row[`course${courseNum}_title`] = course.title;
			row[`course${courseNum}_fullId`] = course.id;
		});

		return row;
	});

	// Get the maximum number of courses for highest avg chart
	const maxAvgCourses = Math.max(...insights.map((d) => d.highestAverageCourses.length));

	// Custom tooltip for better UX
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0]?.payload;
			return (
				<div
					style={{
						backgroundColor: "rgba(255, 255, 255, 0.95)",
						padding: "12px",
						border: "2px solid #8b5cf6",
						borderRadius: "8px",
						boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
					}}
				>
					<p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#1f2937" }}>
						{data?.fullTitle || data?.displayName || data?.dept || label}
					</p>
					{data?.fullCourseId && (
						<p style={{ margin: "4px 0", color: "#6b7280", fontSize: "12px" }}>
							Course ID: <strong>{data.fullCourseId}</strong>
						</p>
					)}
					{payload.map((entry: any, index: number) => (
						<p key={index} style={{ margin: "4px 0", color: entry.color, fontSize: "14px" }}>
							{entry.name}:{" "}
							<strong>{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</strong>
						</p>
					))}
				</div>
			);
		}
		return null;
	};

	return (
		<div style={{ width: "100%" }}>
			{/* Chart 1: Top Departments by Enrollment (Vertical Bar Chart) */}
			<Card className="mb-4" style={{ borderColor: "#8b5cf6", borderWidth: "2px" }}>
				<Card.Header style={{ backgroundColor: "#8b5cf6", color: "white" }}>
					<h5 className="mb-0">📊 Top Departments by Total Enrollment</h5>
				</Card.Header>
				<Card.Body>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
							<XAxis
								dataKey="dept"
								tick={{ fill: "#374151", fontSize: 14, fontWeight: "bold" }}
								tickLine={{ stroke: "#9ca3af" }}
							/>
							<YAxis
								tick={{ fill: "#374151", fontSize: 12 }}
								tickLine={{ stroke: "#9ca3af" }}
								label={{ value: "Total Enrollment", angle: -90, position: "insideLeft", style: { fill: "#374151" } }}
							/>
							<Tooltip content={<CustomTooltip />} />
							<Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
							<Bar dataKey="totalEnrollment" name="Total Enrollment" radius={[8, 8, 0, 0]}>
								{departmentData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</Card.Body>
			</Card>

			{/* Chart 2: Top Courses by Enrollment (Horizontal Grouped Bar Chart) */}
			<Card className="mb-4" style={{ borderColor: "#06b6d4", borderWidth: "2px" }}>
				<Card.Header style={{ backgroundColor: "#06b6d4", color: "white" }}>
					<h5 className="mb-0">🎓 Top Courses by Enrollment</h5>
				</Card.Header>
				<Card.Body>
					<ResponsiveContainer width="100%" height={Math.max(400, topCoursesData.length * 150)}>
						<BarChart data={topCoursesData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 20 }} barCategoryGap="20%">
							<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
							<XAxis
								type="number"
								tick={{ fill: "#374151", fontSize: 12 }}
								label={{ value: "Enrollment", position: "insideBottom", offset: -5, style: { fill: "#374151" } }}
								domain={[0, 'auto']}
							/>
							<YAxis
								type="category"
								dataKey="dept"
								tick={{ fill: "#374151", fontSize: 14, fontWeight: "bold" }}
								width={70}
							/>
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload.length > 0) {
										const data = payload[0].payload; // Get the department data
										const dept = data.dept;

										// Collect all courses for this department
										const courses: Array<{ id: string; fullId: string; title: string; enrollment: number }> = [];
										for (let i = 1; i <= maxCourses; i++) {
											const enrollment = data[`course${i}`];
											if (enrollment !== null && enrollment !== undefined) {
												courses.push({
													id: data[`course${i}_id`],
													fullId: data[`course${i}_fullId`],
													title: data[`course${i}_title`],
													enrollment: enrollment,
												});
											}
										}

										if (courses.length === 0) return null;

										return (
											<div
												style={{
													backgroundColor: "rgba(255, 255, 255, 0.95)",
													padding: "12px",
													border: "2px solid #06b6d4",
													borderRadius: "8px",
													boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
													maxWidth: "300px",
												}}
											>
												<p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#1f2937", fontSize: "14px" }}>
													{dept} - Top Courses
												</p>
												{courses.map((course, idx) => (
													<div key={idx} style={{ marginBottom: idx < courses.length - 1 ? "8px" : "0" }}>
														<p style={{ margin: "0", color: "#374151", fontSize: "12px", fontWeight: "600" }}>
															{course.id}: {course.title}
														</p>
														<p style={{ margin: "2px 0 0 0", color: "#06b6d4", fontSize: "12px" }}>
															Enrollment: <strong>{course.enrollment.toLocaleString()}</strong>
														</p>
													</div>
												))}
											</div>
										);
									}
									return null;
								}}
							/>
							<Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
							{Array.from({ length: maxCourses }, (_, i) => i + 1).map((courseNum) => (
								<Bar
									key={`course${courseNum}`}
									dataKey={`course${courseNum}`}
									name={`Course ${courseNum}`}
									fill={COURSE_COLORS[(courseNum - 1) % COURSE_COLORS.length]}
									radius={[0, 8, 8, 0]}
								/>
							))}
						</BarChart>
					</ResponsiveContainer>
					<div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
						<strong>Note:</strong> Each department shows up to 5 top courses. Hover over bars for course details.
					</div>
				</Card.Body>
			</Card>

			{/* Chart 3: Highest Average Courses (Horizontal Grouped Bar Chart) */}
			<Card className="mb-4" style={{ borderColor: "#f59e0b", borderWidth: "2px" }}>
				<Card.Header style={{ backgroundColor: "#f59e0b", color: "white" }}>
					<h5 className="mb-0">⭐ Courses with Highest Averages</h5>
				</Card.Header>
				<Card.Body>
					<ResponsiveContainer width="100%" height={Math.max(400, highestAvgData.length * 150)}>
						<BarChart data={highestAvgData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 20 }} barCategoryGap="20%">
							<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
							<XAxis
								type="number"
								tick={{ fill: "#374151", fontSize: 12 }}
								label={{ value: "Average Grade", position: "insideBottom", offset: -5, style: { fill: "#374151" } }}
								domain={[0, 100]}
							/>
							<YAxis
								type="category"
								dataKey="dept"
								tick={{ fill: "#374151", fontSize: 14, fontWeight: "bold" }}
								width={70}
							/>
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload.length > 0) {
										const data = payload[0].payload; // Get the department data
										const dept = data.dept;

										// Collect all courses for this department
										const courses: Array<{ id: string; fullId: string; title: string; average: number }> = [];
										for (let i = 1; i <= maxAvgCourses; i++) {
											const average = data[`course${i}`];
											if (average !== null && average !== undefined) {
												courses.push({
													id: data[`course${i}_id`],
													fullId: data[`course${i}_fullId`],
													title: data[`course${i}_title`],
													average: average,
												});
											}
										}

										if (courses.length === 0) return null;

										return (
											<div
												style={{
													backgroundColor: "rgba(255, 255, 255, 0.95)",
													padding: "12px",
													border: "2px solid #f59e0b",
													borderRadius: "8px",
													boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
													maxWidth: "300px",
												}}
											>
												<p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#1f2937", fontSize: "14px" }}>
													{dept} - Highest Averages
												</p>
												{courses.map((course, idx) => (
													<div key={idx} style={{ marginBottom: idx < courses.length - 1 ? "8px" : "0" }}>
														<p style={{ margin: "0", color: "#374151", fontSize: "12px", fontWeight: "600" }}>
															{course.id}: {course.title}
														</p>
														<p style={{ margin: "2px 0 0 0", color: "#f59e0b", fontSize: "12px" }}>
															Average: <strong>{course.average.toFixed(2)}</strong>
														</p>
													</div>
												))}
											</div>
										);
									}
									return null;
								}}
							/>
							<Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
							{Array.from({ length: maxAvgCourses }, (_, i) => i + 1).map((courseNum) => (
								<Bar
									key={`course${courseNum}`}
									dataKey={`course${courseNum}`}
									name={`Course ${courseNum}`}
									fill={COURSE_COLORS[(courseNum - 1) % COURSE_COLORS.length]}
									radius={[0, 8, 8, 0]}
								/>
							))}
						</BarChart>
					</ResponsiveContainer>
					<div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
						<strong>Note:</strong> Each department shows up to 4 courses with highest averages. Hover over bars for
						course details.
					</div>
				</Card.Body>
			</Card>
		</div>
	);
};
