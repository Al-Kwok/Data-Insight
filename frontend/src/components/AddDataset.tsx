import React, { useState, useRef } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { api } from "../services/api";

interface AddDatasetProps {
	onDatasetAdded?: () => Promise<void>;
}

export const AddDataset: React.FC<AddDatasetProps> = ({ onDatasetAdded }) => {
	const [datasetId, setDatasetId] = useState("");
	const [zipFile, setZipFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setZipFile(e.target.files[0]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);

		if (!datasetId.trim()) {
			setMessage({ type: "danger", text: "Please enter a dataset ID" });
			return;
		}

		if (!zipFile) {
			setMessage({ type: "danger", text: "Please select a ZIP file" });
			return;
		}

		try {
			setLoading(true);
			const result = await api.addDataset(datasetId, zipFile);
			setMessage({
				type: "success",
				text: `Dataset added successfully! Current datasets: ${result.join(", ")}`,
			});
			setDatasetId("");
			setZipFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			// Trigger callback to refresh dataset list in background
			if (onDatasetAdded) {
				await onDatasetAdded();
			}
		} catch (error: any) {
			setMessage({ type: "danger", text: error.message || "Failed to add dataset" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="mb-4">
			<Card.Header>
				<h5 className="mb-0">Add Dataset</h5>
			</Card.Header>
			<Card.Body>
				<Form onSubmit={handleSubmit}>
					<Form.Group className="mb-3">
						<Form.Label>Dataset ID</Form.Label>
						<Form.Text className="d-block text-muted mb-2">
							Must not contain underscores or be only whitespace
						</Form.Text>
						<Form.Control
							type="text"
							placeholder="e.g., courses"
							value={datasetId}
							onChange={(e) => setDatasetId(e.target.value)}
							disabled={loading}
						/>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>ZIP File (Sections)</Form.Label>
						<Form.Control ref={fileInputRef} type="file" accept=".zip" onChange={handleFileChange} disabled={loading} />
					</Form.Group>

					{message && (
						<Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
							{message.text}
						</Alert>
					)}

					<Button variant="primary" type="submit" disabled={loading}>
						{loading ? "Adding..." : "Add Dataset"}
					</Button>
				</Form>
			</Card.Body>
		</Card>
	);
};
