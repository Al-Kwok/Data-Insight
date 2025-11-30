import React, { useState, useCallback, useEffect } from "react";
import { Container, Navbar, Nav, Tab, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { AddDataset } from "./components/AddDataset";
import { RemoveDataset } from "./components/RemoveDataset";
import { ListDatasets } from "./components/ListDatasets";
import { InsightDataset } from "./services/types";
import { api } from "./services/api";

function App() {
	const [activeTab, setActiveTab] = useState("add");
	const [datasets, setDatasets] = useState<InsightDataset[]>([]);
	const [refreshCounter, setRefreshCounter] = useState(0);

	const refreshDatasets = useCallback(async () => {
		try {
			console.log("Refreshing datasets...");
			const result = await api.listDatasets();
			console.log("API returned datasets:", result.length, result);
			setDatasets(result);
			setRefreshCounter((prev) => prev + 1);
		} catch (error) {
			console.error("Failed to refresh datasets:", error);
		}
	}, []);

	const handleDatasetAdded = useCallback(async () => {
		// Refresh datasets in the background so they're ready when user switches to list tab
		await refreshDatasets();
	}, [refreshDatasets]);

	const handleDatasetRemoved = useCallback(async () => {
		// Refresh datasets in the background so they're ready when user switches to list tab
		await refreshDatasets();
	}, [refreshDatasets]);

	// Load datasets on initial app startup
	useEffect(() => {
		refreshDatasets();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Auto-refresh datasets when user switches to the "list" tab
	useEffect(() => {
		console.log("Active tab changed to:", activeTab);
		if (activeTab === "list") {
			console.log("Triggering refresh for list tab");
			refreshDatasets();
		}
	}, [activeTab, refreshDatasets]);

	return (
		<div className="App">
			<Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
				<Container>
					<Navbar.Brand>InsightFacade</Navbar.Brand>
					<Navbar.Text className="text-muted">UBC Course Sections Query System</Navbar.Text>
				</Container>
			</Navbar>

			<Container>
				<Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "add")}>
					<Row>
						<Col sm={12}>
							<Nav variant="tabs" className="mb-4">
								<Nav.Item>
									<Nav.Link eventKey="add">Add Dataset</Nav.Link>
								</Nav.Item>
								<Nav.Item>
									<Nav.Link eventKey="remove">Remove Dataset</Nav.Link>
								</Nav.Item>
								<Nav.Item>
									<Nav.Link eventKey="list">List Datasets</Nav.Link>
								</Nav.Item>
							</Nav>
						</Col>
					</Row>

					<Row>
						<Col sm={12}>
							<Tab.Content>
								<Tab.Pane eventKey="add">
									<AddDataset onDatasetAdded={handleDatasetAdded} />
								</Tab.Pane>
								<Tab.Pane eventKey="remove">
									<RemoveDataset onDatasetRemoved={handleDatasetRemoved} />
								</Tab.Pane>
								<Tab.Pane eventKey="list">
									<ListDatasets key={refreshCounter} datasets={datasets} />
								</Tab.Pane>
							</Tab.Content>
						</Col>
					</Row>
				</Tab.Container>
			</Container>

			<footer className="mt-5 py-3 bg-light text-center text-muted">
				<Container>
					<small>InsightFacade - UBC CPSC 310 Project</small>
				</Container>
			</footer>
		</div>
	);
}

export default App;
