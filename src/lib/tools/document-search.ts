import { tool } from "ai";
import { env } from "cloudflare:workers";
import { z } from "zod";

const documentSearchSchema = z.object({
	query: z.string().describe("The search query to find relevant documents"),
});
export const documentSearchTool = tool({
	description: "Search for relevant documents based on keywords or phrases",
	inputSchema: documentSearchSchema,
	execute: async ({ query }: { query: string }) => {
		const response = (await env.ai.autorag("tgxai-rag").search({
			query,
		})) as AutoRagSearchResponse;

		return response;
	},
});
