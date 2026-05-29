import React, { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { api } from "../services/api";

interface RemoveDatasetProps {
	onDatasetRemoved?: () => Promise<void>;
}

export const RemoveDataset: React.FC<RemoveDatasetProps> = ({ onDatasetRemoved }) => {
	const [datasetId, setDatasetId] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);

		if (!datasetId.trim()) {
			setMessage({ type: "danger", text: "Please enter a dataset ID" });
			return;
		}

		try {
			setLoading(true);
			const result = await api.removeDataset(datasetId);
			setMessage({
				type: "success",
				text: `Dataset "${result}" removed successfully!`,
			});
			setDatasetId("");

			// Trigger callback to refresh dataset list in background
			if (onDatasetRemoved) {
				await onDatasetRemoved();
			}
		} catch (error: any) {
			setMessage({ type: "danger", text: error.message || "Failed to remove dataset" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="mb-4">
			<Card.Header>
				<h5 className="mb-0">Remove Dataset</h5>
			</Card.Header>
			<Card.Body>
				<Form onSubmit={handleSubmit}>
					<Form.Group className="mb-3">
						<Form.Label>Dataset ID</Form.Label>
						<Form.Control
							type="text"
							placeholder="e.g., courses"
							value={datasetId}
							onChange={(e) => setDatasetId(e.target.value)}
							disabled={loading}
						/>
					</Form.Group>

					{message && (
						<Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
							{message.text}
						</Alert>
					)}

					<Button variant="danger" type="submit" disabled={loading}>
						{loading ? "Removing..." : "Remove Dataset"}
					</Button>
				</Form>
			</Card.Body>
		</Card>
	);
};
