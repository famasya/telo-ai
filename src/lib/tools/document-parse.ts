import { tool } from "ai";
import { env } from "cloudflare:workers";
import { z } from "zod";

export const documentParse = tool({
	description: "Parse a document and return its content as text",
	inputSchema: z.object({
		filename: z
			.string()
			.describe(
				"File name including extension (e.g., document.pdf, report.docx). Must be a valid file name that exists in the tgxai-buckets.abidf.com bucket.",
			),
	}),
	execute: async ({ filename }: { filename: string }) => {
		// first search for the document in kv to verify it exists
		const kvValue = await env.kv.get<string>(filename);
		if (kvValue) {
			return { content: kvValue };
		}
		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "openai/gpt-5-nano",
					messages: [
						{
							role: "user",
							content: [
								{
									type: "text",
									text: "What are the main points in this document?",
								},
								{
									type: "file",
									file: {
										filename,
										file_data: `https://tgxai-buckets.abidf.com/${filename}`,
									},
								},
							],
						},
					],
				}),
			},
		);

		const data = (await response.json()) as {
			id: string;
			provider: string;
			model: string;
			object: string;
			created: number;
			choices: Array<{
				message: {
					role: string;
					content: string;
				};
			}>;
			usage: {
				prompt_tokens: number;
				completion_tokens: number;
				total_tokens: number;
			};
		};

		const content = data.choices
			.map((choice) => choice.message.content)
			.join("\n");
		// save to kv for future use
		await env.kv.put(filename, content);

		return {
			content: content,
		};
	},
});
