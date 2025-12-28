import { tool } from "ai";
import { env } from "cloudflare:workers";
import z from "zod";

const documentBatchContentSearchSchema = z.object({
	query: z.string().describe("Search query for content across documents"),
	filenames: z
		.array(z.string())
		.min(1)
		.max(5)
		.describe("Array of filenames to search (max 5, most relevant first)"),
});

export const documentBatchContentSearchTool = tool({
	description:
		"Search content in multiple documents simultaneously (up to 5). Returns aggregated results from all specified documents.",
	inputSchema: documentBatchContentSearchSchema,
	execute: async ({ query, filenames }) => {
		// Process sequentially to avoid exceeding Cloudflare Worker resource limits
		const results = [];
		for (const filename of filenames) {
			try {
				const response = await env.ai.autorag("tgxai-rag").search({
					query,
					filters: {
						type: "eq",
						key: "filename",
						value: filename,
					},
				});
				results.push({
					filename,
					success: true,
					data: response.data,
					search_query: response.search_query,
				});
			} catch (error) {
				results.push({
					filename,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
					data: [],
				});
			}
		}

		const totalChunks = results.reduce(
			(sum, r) => sum + (r.success ? r.data.length : 0),
			0,
		);
		const successCount = results.filter((r) => r.success).length;

		return {
			query,
			totalDocuments: filenames.length,
			successfulDocuments: successCount,
			totalChunks,
			results,
			summary: `Retrieved ${totalChunks} chunks from ${successCount}/${filenames.length} documents.`,
		};
	},
});
