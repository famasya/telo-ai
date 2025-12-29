import type { ChatUIMessage } from "@/routes/api/chat";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import superjson from "superjson";
import z from "zod";

export const shareLink = createServerFn()
	.inputValidator(
		z.object({
			messages: z.array(z.custom<ChatUIMessage>()),
			shareId: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		// Filter out tool calls before storing
		const filteredMessages = data.messages.map((msg) => ({
			...msg,
			parts: msg.parts.filter((part) => !part.type.startsWith("tool-")),
		}));

		// Use existing shareId or create new one
		const shareId = data.shareId || `${Date.now()}`;
		await env.kv.put(`share:${shareId}`, superjson.stringify(filteredMessages));
		return { key: shareId };
	});

export const getSharedMessages = createServerFn()
	.inputValidator(
		z.object({
			shareId: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const result = await env.kv.get(`share:${data.shareId}`);
		if (!result) {
			throw new Error("Share not found");
		}
		return result;
	});
