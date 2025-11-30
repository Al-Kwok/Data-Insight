import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import InsightFacade from "../src/controller/InsightFacade";
import { InsightDatasetKind, InsightError, NotFoundError, ResultTooLargeError } from "../src/controller/IInsightFacade";
import { DatasetInsights } from "../src/controller/DatasetInsights";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit for base64 datasets
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize InsightFacade
const insightFacade = new InsightFacade();

// API Routes - Version 1
const API_VERSION = "/api/v1";

// PUT /api/v1/datasets/:id/:kind - Add a dataset
app.put(`${API_VERSION}/datasets/:id/:kind`, async (req: Request, res: Response) => {
	try {
		const { id, kind } = req.params;
		const { content } = req.body;

		if (!content) {
			return res.status(400).json({ error: "Missing content in request body" });
		}

		// Validate kind parameter
		if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
			return res.status(400).json({ error: "Invalid dataset kind. Must be 'sections' or 'rooms'" });
		}

		const result = await insightFacade.addDataset(id, content, kind as InsightDatasetKind);
		res.status(201).json({ result }); // 201 Created for new resource
	} catch (error) {
		if (error instanceof InsightError) {
			res.status(400).json({ error: error.message });
		} else {
			res.status(500).json({ error: "Internal server error" });
		}
	}
});

// DELETE /api/v1/datasets/:id - Remove a dataset
app.delete(`${API_VERSION}/datasets/:id`, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const result = await insightFacade.removeDataset(id);
		res.status(200).json({ result });
	} catch (error) {
		if (error instanceof NotFoundError) {
			res.status(404).json({ error: error.message });
		} else if (error instanceof InsightError) {
			res.status(400).json({ error: error.message });
		} else {
			res.status(500).json({ error: "Internal server error" });
		}
	}
});

// GET /api/v1/datasets - List all datasets
app.get(`${API_VERSION}/datasets`, async (req: Request, res: Response) => {
	try {
		const result = await insightFacade.listDatasets();
		res.status(200).json({ result });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /api/v1/queries - Perform a query
app.post(`${API_VERSION}/queries`, async (req: Request, res: Response) => {
	try {
		const query = req.body;
		const result = await insightFacade.performQuery(query);
		res.status(200).json({ result });
	} catch (error) {
		if (error instanceof ResultTooLargeError) {
			res.status(400).json({ error: error.message });
		} else if (error instanceof InsightError) {
			res.status(400).json({ error: error.message });
		} else {
			res.status(500).json({ error: "Internal server error" });
		}
	}
});

// GET /api/v1/insights/:id - Generate insights for a dataset
app.get(`${API_VERSION}/insights/:id`, async (req: Request, res: Response) => {
	console.log(`[INSIGHTS] Request received for dataset: ${req.params.id}`);
	try {
		const { id } = req.params;
		console.log(`[INSIGHTS] Creating DatasetInsights instance for: ${id}`);
		const datasetInsights = new DatasetInsights(insightFacade);
		console.log(`[INSIGHTS] Generating insights for: ${id}`);
		const insights = await datasetInsights.generateInsights(id);
		console.log(`[INSIGHTS] Successfully generated ${insights.length} insights`);
		res.status(200).json({ result: insights });
	} catch (error) {
		console.error(`[INSIGHTS] Error generating insights:`, error);
		if (error instanceof InsightError) {
			res.status(400).json({ error: error.message });
		} else {
			res.status(500).json({ error: "Internal server error" });
		}
	}
});

// Serve static files from React build
// In dev mode (ts-node): __dirname = server/
// In prod mode (compiled): __dirname = dist/server/
const frontendBuildPath = __dirname.includes("dist")
	? path.join(__dirname, "../../../frontend/build") // Production
	: path.join(__dirname, "../frontend/build"); // Development
app.use(express.static(frontendBuildPath));

// Serve React app for any route not handled by API (must be after static files)
app.use((req: Request, res: Response, next: NextFunction) => {
	// If the request is for an API endpoint that doesn't exist, let it fall through to 404
	if (req.path.startsWith("/api/")) {
		return res.status(404).json({ error: "API endpoint not found" });
	}
	// Otherwise serve the React app
	res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error("Unhandled error:", err);
	res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
	console.log(`InsightFacade server listening on port ${PORT}`);
	console.log(`Frontend: http://localhost:${PORT}`);
	console.log(`REST API endpoints (v1):`);
	console.log(`  PUT    ${API_VERSION}/datasets/:id/:kind - Add a dataset`);
	console.log(`  DELETE ${API_VERSION}/datasets/:id       - Remove a dataset`);
	console.log(`  GET    ${API_VERSION}/datasets           - List all datasets`);
	console.log(`  POST   ${API_VERSION}/queries            - Perform a query`);
	console.log(`  GET    ${API_VERSION}/insights/:id       - Generate dataset insights`);
});

export default app;
