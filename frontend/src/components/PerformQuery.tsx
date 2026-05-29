import React, { useState } from "react";
import { Card, Form, Button, Alert, Table, Badge } from "react-bootstrap";
import { api } from "../services/api";
import { InsightResult } from "../services/types";

const exampleQuery = {
	WHERE: {
		GT: {
			courses_avg: 97,
		},
	},
	OPTIONS: {
		COLUMNS: ["courses_dept", "courses_id", "courses_avg"],
		ORDER: "courses_avg",
	},
};

export const PerformQuery: React.FC = () => {
	const [queryText, setQueryText] = useState(JSON.stringify(exampleQuery, null, 2));
	const [results, setResults] = useState<InsightResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);
		setResults([]);

		if (!queryText.trim()) {
			setMessage({ type: "danger", text: "Please enter a query" });
			return;
		}

		try {
			setLoading(true);
			const query = JSON.parse(queryText);
			const result = await api.performQuery(query);
			setResults(result);
			setMessage({
				type: "success",
				text: `Query executed successfully! Found ${result.length} result(s).`,
			});
		} catch (error: any) {
			if (error instanceof SyntaxError) {
				setMessage({ type: "danger", text: "Invalid JSON format in query" });
			} else {
				setMessage({ type: "danger", text: error.message || "Query failed" });
			}
		} finally {
			setLoading(false);
		}
	};

	const handleLoadExample = () => {
		setQueryText(JSON.stringify(exampleQuery, null, 2));
		setMessage(null);
		setResults([]);
	};

	const renderResultsTable = () => {
		if (results.length === 0) return null;

		const columns = Object.keys(results[0]);

		return (
			<div className="mt-4">
				<div className="mb-2">
					<Badge bg="success">{results.length} result(s)</Badge>
				</div>
				<div style={{ maxHeight: "400px", overflowY: "auto" }}>
					<Table striped bordered hover size="sm">
						<thead style={{ position: "sticky", top: 0, backgroundColor: "#fff" }}>
							<tr>
								<th>#</th>
								{columns.map((col) => (
									<th key={col}>{col}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{results.map((result, index) => (
								<tr key={index}>
									<td>{index + 1}</td>
									{columns.map((col) => (
										<td key={col}>{result[col]}</td>
									))}
								</tr>
							))}
						</tbody>
					</Table>
				</div>
			</div>
		);
	};

	return (
		<Card className="mb-4">
			<Card.Header>
				<h5 className="mb-0">Perform Query</h5>
			</Card.Header>
			<Card.Body>
				<Form onSubmit={handleSubmit}>
					<Form.Group className="mb-3">
						<Form.Label>Query (JSON format)</Form.Label>
						<Form.Text className="d-block text-muted mb-2">
							Enter your query in JSON format. You can use the example below as a template.
						</Form.Text>
						<Form.Control
							as="textarea"
							rows={12}
							value={queryText}
							onChange={(e) => setQueryText(e.target.value)}
							disabled={loading}
							style={{ fontFamily: "monospace", fontSize: "0.9em" }}
						/>
					</Form.Group>

					{message && (
						<Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
							{message.text}
						</Alert>
					)}

					<div className="d-flex gap-2">
						<Button variant="primary" type="submit" disabled={loading}>
							{loading ? "Executing..." : "Execute Query"}
						</Button>
						<Button variant="secondary" onClick={handleLoadExample} disabled={loading} type="button">
							Load Example
						</Button>
					</div>
				</Form>

				{renderResultsTable()}
			</Card.Body>
		</Card>
	);
};
