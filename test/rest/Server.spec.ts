import { expect } from "chai";
import request from "supertest";
import app from "../../server/server";
import { clearDisk, getContentFromArchives } from "../TestUtil";

describe("Server REST API Tests", function (this: Mocha.Suite) {
	// Increase timeout for server operations
	this.timeout(10000);

	// Test datasets (base64 zips) loaded once for speed
	let sectionsTiny: string;
	let sectionsSmall: string;
	let roomsDataset: string;
	let emptyZip: string;

	before(async function () {
		// Load test datasets once before all tests
		sectionsTiny = await getContentFromArchives("tiny.zip");
		sectionsSmall = await getContentFromArchives("small.zip");
		roomsDataset = await getContentFromArchives("campus.zip");
		emptyZip = await getContentFromArchives("empty.zip");
	});

	beforeEach(async function () {
		// Clear disk before each test to ensure clean state
		await clearDisk();
	});

	describe("PUT /api/v1/datasets/:id/:kind - Add Dataset", function () {
		it("should successfully add a valid sections dataset", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/sections1/sections")
				.send({ content: sectionsTiny })
				.expect(201)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("result");
			expect(response.body.result).to.be.an("array");
			expect(response.body.result).to.include("sections1");
		});

		it("should successfully add a valid rooms dataset", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/rooms1/rooms")
				.send({ content: roomsDataset })
				.expect(201)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("result");
			expect(response.body.result).to.be.an("array");
			expect(response.body.result).to.include("rooms1");
		});

		it("should successfully add multiple datasets", async function () {
			// Add first dataset
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsTiny }).expect(201);

			// Add second dataset
			const response = await request(app)
				.put("/api/v1/datasets/sections2/sections")
				.send({ content: sectionsSmall })
				.expect(201);

			expect(response.body.result).to.have.lengthOf(2);
			expect(response.body.result).to.include.members(["sections1", "sections2"]);
		});

		it("should reject when content is missing", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/sections1/sections")
				.send({})
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
			expect(response.body.error).to.equal("Missing content in request body");
		});

		it("should reject with invalid dataset kind", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/sections1/invalid")
				.send({ content: sectionsTiny })
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
			expect(response.body.error).to.include("Invalid dataset kind");
		});

		it("should reject with empty dataset id", async function () {
			const response = await request(app).put("/api/v1/datasets//sections").send({ content: sectionsTiny }).expect(404); // Express treats empty param as not matching route

			expect(response.body).to.have.property("error");
		});

		it("should reject with id containing underscore", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/invalid_id/sections")
				.send({ content: sectionsTiny })
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});

		it("should reject with whitespace-only id", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/   /sections")
				.send({ content: sectionsTiny })
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});

		it("should reject duplicate dataset id", async function () {
			// Add dataset first time
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsTiny }).expect(201);

			// Try adding same id again
			const response = await request(app)
				.put("/api/v1/datasets/sections1/sections")
				.send({ content: sectionsSmall })
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});

		it("should reject invalid zip content", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/sections1/sections")
				.send({ content: "not-a-valid-base64-zip" })
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});

		it("should reject empty zip with no valid sections", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/sections1/sections")
				.send({ content: emptyZip })
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});

		it("should reject sections data as rooms dataset", async function () {
			const response = await request(app)
				.put("/api/v1/datasets/rooms1/rooms")
				.send({ content: sectionsTiny })
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});
	});

	describe("DELETE /api/v1/datasets/:id - Remove Dataset", function () {
		it("should successfully remove an existing dataset", async function () {
			// First add a dataset
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsTiny }).expect(201);

			// Then remove it
			const response = await request(app)
				.delete("/api/v1/datasets/sections1")
				.expect(200)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("result");
			expect(response.body.result).to.equal("sections1");
		});

		it("should remove correct dataset when multiple exist", async function () {
			// Add two datasets
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsTiny }).expect(201);

			await request(app).put("/api/v1/datasets/sections2/sections").send({ content: sectionsSmall }).expect(201);

			// Remove first dataset
			await request(app).delete("/api/v1/datasets/sections1").expect(200);

			// Verify second dataset still exists
			const listResponse = await request(app).get("/api/v1/datasets").expect(200);

			expect(listResponse.body.result).to.have.lengthOf(1);
			expect(listResponse.body.result[0].id).to.equal("sections2");
		});

		it("should reject removing non-existing dataset", async function () {
			const response = await request(app)
				.delete("/api/v1/datasets/nonexistent")
				.expect(404)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});

		it("should reject removing with empty id", async function () {
			const response = await request(app).delete("/api/v1/datasets/").expect(404); // Express treats this as not matching route

			expect(response.body).to.have.property("error");
		});

		it("should reject removing with id containing underscore", async function () {
			const response = await request(app)
				.delete("/api/v1/datasets/invalid_id")
				.expect(400)
				.expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});

		it("should reject removing with whitespace-only id", async function () {
			const response = await request(app).delete("/api/v1/datasets/   ").expect(400).expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
		});
	});

	describe("GET /api/v1/datasets - List Datasets", function () {
		it("should return empty array when no datasets exist", async function () {
			const response = await request(app).get("/api/v1/datasets").expect(200).expect("Content-Type", /json/);

			expect(response.body).to.have.property("result");
			expect(response.body.result).to.be.an("array");
			expect(response.body.result).to.have.lengthOf(0);
		});

		it("should list a single dataset", async function () {
			// Add a dataset
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsTiny }).expect(201);

			// List datasets
			const response = await request(app).get("/api/v1/datasets").expect(200);

			expect(response.body.result).to.have.lengthOf(1);
			expect(response.body.result[0]).to.have.property("id", "sections1");
			expect(response.body.result[0]).to.have.property("kind", "sections");
			expect(response.body.result[0]).to.have.property("numRows");
		});

		it("should list multiple datasets", async function () {
			// Add multiple datasets
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsTiny }).expect(201);

			await request(app).put("/api/v1/datasets/sections2/sections").send({ content: sectionsSmall }).expect(201);

			await request(app).put("/api/v1/datasets/rooms1/rooms").send({ content: roomsDataset }).expect(201);

			// List datasets
			const response = await request(app).get("/api/v1/datasets").expect(200);

			expect(response.body.result).to.have.lengthOf(3);
			const ids = response.body.result.map((ds: any) => ds.id);
			expect(ids).to.include.members(["sections1", "sections2", "rooms1"]);
		});

		it("should reflect changes after adding and removing datasets", async function () {
			// Add datasets
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsTiny }).expect(201);

			await request(app).put("/api/v1/datasets/sections2/sections").send({ content: sectionsSmall }).expect(201);

			// Verify 2 datasets exist
			let response = await request(app).get("/api/v1/datasets").expect(200);
			expect(response.body.result).to.have.lengthOf(2);

			// Remove one dataset
			await request(app).delete("/api/v1/datasets/sections1").expect(200);

			// Verify only 1 dataset remains
			response = await request(app).get("/api/v1/datasets").expect(200);
			expect(response.body.result).to.have.lengthOf(1);
			expect(response.body.result[0].id).to.equal("sections2");
		});
	});

	describe("GET /api/v1/insights/:id - Generate Insights", function () {
		it("should generate insights for an existing sections dataset", async function () {
			// Add a dataset first - use sectionsSmall for more data
			await request(app).put("/api/v1/datasets/sections1/sections").send({ content: sectionsSmall }).expect(201);

			// Generate insights
			const response = await request(app).get("/api/v1/insights/sections1").expect(200).expect("Content-Type", /json/);

			expect(response.body).to.have.property("result");
			expect(response.body.result).to.be.an("array");

			// Verify insights structure
			if (response.body.result.length > 0) {
				const insight = response.body.result[0];
				expect(insight).to.have.property("dept");
				expect(insight).to.have.property("totalEnrollment");
				expect(insight).to.have.property("historicalAverage");
				expect(insight).to.have.property("topCourses");
				expect(insight).to.have.property("highestAverageCourses");
			}
		});

		it("should handle request for non-existing dataset", async function () {
			const response = await request(app).get("/api/v1/insights/nonexistent");

			// May return either 200 with empty result or 400 with error
			expect(response.status).to.be.oneOf([400, 200]);
			if (response.status === 200) {
				expect(response.body).to.have.property("result");
			} else {
				expect(response.body).to.have.property("error");
			}
		});
	});

	describe("API Error Handling", function () {
		it("should return 404 for non-existent API endpoint", async function () {
			const response = await request(app).get("/api/v1/nonexistent").expect(404).expect("Content-Type", /json/);

			expect(response.body).to.have.property("error");
			expect(response.body.error).to.include("API endpoint not found");
		});
	});
});
