import React, { useState } from "react";
import { Card, Table, Alert, Badge, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { InsightDataset, DepartmentInsight } from "../services/types";
import { api } from "../services/api";
import { DataInsightsVisualization } from "./DataInsightsVisualization";

interface ListDatasetsProps {
	datasets: InsightDataset[];
}

export const ListDatasets: React.FC<ListDatasetsProps> = ({ datasets }) => {
	const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
	const [insights, setInsights] = useState<DepartmentInsight[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGenerateInsights = async () => {
		if (!selectedDatasetId) {
			setError("Please select a dataset first");
			return;
		}

		setLoading(true);
		setError(null);
		setInsights(null);

		try {
			const result = await api.generateInsights(selectedDatasetId);
			setInsights(result);
		} catch (err: any) {
			setError(err.message || "Failed to generate insights");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Row>
			{/* Left Side: Dataset List */}
			<Col md={4}>
				<Card className="mb-4">
					<Card.Header>
						<h5 className="mb-0">Dataset List</h5>
					</Card.Header>
					<Card.Body>
						{datasets.length === 0 && (
							<Alert variant="info">No datasets found. Add a dataset using the "Add Dataset" tab.</Alert>
						)}

						{datasets.length > 0 && (
							<>
								<div className="mb-3">
									<Badge bg="success">{datasets.length} dataset(s) found</Badge>
								</div>
								<Table striped bordered hover responsive size="sm">
									<thead>
										<tr>
											<th style={{ width: "50px" }}>Select</th>
											<th>Dataset ID</th>
											<th>Kind</th>
											<th>Rows</th>
										</tr>
									</thead>
									<tbody>
										{datasets.map((dataset) => (
											<tr
												key={dataset.id}
												style={{
													backgroundColor: selectedDatasetId === dataset.id ? "#f3e8ff" : "transparent",
													cursor: "pointer",
												}}
												onClick={() => setSelectedDatasetId(dataset.id)}
											>
												<td className="text-center">
													<Form.Check
														type="radio"
														name="datasetSelection"
														checked={selectedDatasetId === dataset.id}
														onChange={() => setSelectedDatasetId(dataset.id)}
														aria-label={`Select ${dataset.id}`}
													/>
												</td>
												<td>
													<strong>{dataset.id}</strong>
												</td>
												<td>
													<Badge bg="primary">{dataset.kind}</Badge>
												</td>
												<td>{dataset.numRows.toLocaleString()}</td>
											</tr>
										))}
									</tbody>
								</Table>

								<div className="d-grid gap-2 mt-3">
									<Button
										variant="success"
										size="lg"
										onClick={handleGenerateInsights}
										disabled={!selectedDatasetId || loading}
									>
										{loading ? (
											<>
												<Spinner
													as="span"
													animation="border"
													size="sm"
													role="status"
													aria-hidden="true"
													className="me-2"
												/>
												Generating Insights...
											</>
										) : (
											"📊 Generate Insights"
										)}
									</Button>
								</div>

								{selectedDatasetId && !loading && !insights && (
									<Alert variant="info" className="mt-3">
										<small>
											Selected: <strong>{selectedDatasetId}</strong>
											<br />
											Click "Generate Insights" to view visualizations
										</small>
									</Alert>
								)}
							</>
						)}
					</Card.Body>
				</Card>
			</Col>

			{/* Right Side: Visualizations */}
			<Col md={8}>
				{error && (
					<Alert variant="danger" dismissible onClose={() => setError(null)}>
						{error}
					</Alert>
				)}

				{loading && (
					<Card className="text-center p-5">
						<Spinner animation="border" variant="primary" style={{ width: "4rem", height: "4rem" }} />
						<p className="mt-3">Analyzing data and generating insights...</p>
					</Card>
				)}

				{insights && insights.length > 0 && (
					<div>
						<div className="mb-3">
							<h4>
								📈 Data Insights for <Badge bg="primary">{selectedDatasetId}</Badge>
							</h4>
							<p className="text-muted">Showing insights for top {insights.length} departments</p>
						</div>
						<DataInsightsVisualization insights={insights} />
					</div>
				)}

				{insights && insights.length === 0 && (
					<Alert variant="warning">
						No insights could be generated for this dataset. The dataset may be empty or contain insufficient data.
					</Alert>
				)}

				{!insights && !loading && !error && (
					<Card className="text-center p-5" style={{ backgroundColor: "#f9fafb" }}>
						<div style={{ fontSize: "64px", marginBottom: "20px" }}>📊</div>
						<h5>No Insights Generated Yet</h5>
						<p className="text-muted">
							Select a dataset from the list and click "Generate Insights" to view data visualizations
						</p>
					</Card>
				)}
			</Col>
		</Row>
	);
};
