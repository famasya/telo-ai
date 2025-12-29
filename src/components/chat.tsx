import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { ChatMessages } from "@/components/chat-messages";
import { shareLink } from "@/lib/share";
import { cn } from "@/lib/utils";
import type { ChatUIMessage } from "@/routes/api/chat";
import { useChat } from "@ai-sdk/react";
import {
	CheckmarkCircle02Icon,
	CopyLinkIcon,
	Loading03Icon,
	Quote,
	Share01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";

export default function Chat() {
	const [input, setInput] = useState("");
	const [lastAutoContinuedIndex, setLastAutoContinuedIndex] = useState(-1);
	const [shareUrl, setShareUrl] = useState<string | null>(null);
	const [shareId, setShareId] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);

	// Mutation for sharing/updating chat
	const shareMutation = useMutation({
		mutationFn: async (messagesData: ChatUIMessage[]) => {
			return await shareLink({
				data: { messages: messagesData, shareId: shareId || undefined },
			});
		},
		onSuccess: (result) => {
			const url = `${window.location.origin}/share/${result.key}`;
			setShareUrl(url);
			setShareId(result.key);
		},
		onError: (error) => {
			console.error("Share failed:", error);
			alert("Failed to create share link. Please try again.");
		},
	});

	const { messages, sendMessage, status, regenerate, stop } =
		useChat<ChatUIMessage>();

	// Auto-continue when response stops with only tool calls
	useEffect(() => {
		// Only run when status is ready (ready for input) and we have messages
		if (status === "ready" && messages.length > 0) {
			const lastMessageIndex = messages.length - 1;
			const lastMessage = messages[lastMessageIndex];

			// Skip if we already auto-continued for this message
			if (lastMessageIndex === lastAutoContinuedIndex) {
				return;
			}

			// Check if last message is from assistant
			if (lastMessage.role === "assistant") {
				// Check if it has tool calls (parts with type starting with "tool-")
				const hasToolCalls = lastMessage.parts?.some((part) =>
					part.type.startsWith("tool-"),
				);
				// Check if it has minimal or no text
				const textContent =
					lastMessage.parts
						?.filter((part) => part.type === "text")
						?.map((part) => part.text)
						?.join("") || "";

				// If has tool calls but no substantial text, auto-continue
				if (hasToolCalls && textContent.trim().length < 50) {
					setLastAutoContinuedIndex(lastMessageIndex);
					sendMessage({ text: "lanjutkan" });
				}
			}
		}
	}, [status, messages, lastAutoContinuedIndex, sendMessage]);

	// Auto-save when shareId exists and messages change
	// biome-ignore lint/correctness/useExhaustiveDependencies: shareMutation is stable
	useEffect(() => {
		// Only auto-save if:
		// 1. shareId exists (user has shared before)
		// 2. There are messages to save
		// 3. Status is ready (not streaming/submitting)
		// 4. Not already saving
		if (
			shareId &&
			messages.length > 0 &&
			status === "ready" &&
			!shareMutation.isPending
		) {
			shareMutation.mutate(messages);
		}
	}, [messages, shareId, status]);

	const handleSubmit = (
		message: PromptInputMessage,
		event: FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();

		if (status === "streaming" || status === "submitted") {
			return stop();
		}

		if (!message.text) {
			return;
		}

		sendMessage({ text: message.text });
		setInput("");
	};

	const [suggestionsCache] = useState<string[]>([
		"Carikan peraturan apa saja tentang lingkungan hidup",
		"Ada berapa hibah kendaraan bermotor?",
		"Carikan perda tentang pengadaan barang/jasa",
	]);

	const handleShareChat = () => {
		shareMutation.mutate(messages);
	};

	const handleCopyLink = async () => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 1000);
		} catch (error) {
			console.error("Copy failed:", error);
			alert(`Failed to copy link: ${shareUrl}`);
		}
	};

	return (
		<>
			{/* Messages Area */}
			<div className="flex-1 w-full overflow-hidden max-w-4xl mx-auto [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
				{messages.length > 0 ? (
					<ChatMessages
						messages={messages}
						status={status}
						regenerate={regenerate}
					/>
				) : (
					<div className="max-w-4xl px-4 mx-auto h-full flex flex-col justify-center">
						<div className="text-center flex items-center gap-2 mb-2">
							<span className="bg-gradient-to-tl from-sky-800 via-sky-500 to-sky-400 bg-clip-text text-transparent text-3xl font-semibold selection:bg-sky-200 selection:text-sky-900">
								Telo AI
							</span>
							<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
								Beta
							</span>
						</div>
						<Alert className="mb-4 text-sm space-y-1 bg-orange-50 border-orange-200">
							<p>
								Telo AI masih dalam versi beta. Respons mungkin tidak selalu
								akurat.
							</p>
							<p>
								Jika response terhenti sebelum selesai, silakan ketik
								"lanjutkan" di chatbox.
							</p>
						</Alert>
						<h3 className="text-sm font-semibold text-zinc-800 mb-3 flex items-center gap-2 mt-2">
							<span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
							SARAN PERTANYAAN
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{suggestionsCache.map((suggestion, index) => (
								<button
									key={index.toString()}
									type="button"
									onClick={() => setInput(suggestion)}
									className="group relative text-sm hover:shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/80 text-blue-900 px-4 py-3.5 rounded-xl transition-all duration-200 hover:shadow-xs border border-blue-200/50 hover:border-blue-300 
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 whitespace-normal break-words text-left"
								>
									<div className="flex items-start justify-between gap-2">
										<span className="leading-relaxed">{suggestion}</span>
										<HugeiconsIcon
											icon={Quote}
											strokeWidth={2}
											className="flex-shrink-0 w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors"
										/>
									</div>
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Input Area */}
			<div className="flex-shrink-0 p-2 w-full max-w-4xl mx-auto">
				<PromptInput onSubmit={handleSubmit}>
					<PromptInputBody>
						<PromptInputTextarea
							autoFocus={true}
							className="bg-white"
							onChange={(e) => setInput(e.target.value)}
							value={input}
							placeholder="Ketik pertanyaan disini..."
						/>
					</PromptInputBody>
					<PromptInputFooter className="flex justify-between bg-white">
						<div className="flex items-center gap-2">
							<Button
								size={"sm"}
								variant="outline"
								className={cn(
									"hidden",
									messages.length > 0 && "block flex items-center gap-2",
								)}
								onClick={handleShareChat}
								disabled={
									messages.length === 0 ||
									shareMutation.isPending ||
									status !== "ready"
								}
							>
								{!shareMutation.isPending ? (
									<HugeiconsIcon icon={Share01Icon} size={16} />
								) : (
									<HugeiconsIcon
										icon={Loading03Icon}
										className="animate-spin"
										size={16}
									/>
								)}
								<span>Share chat</span>
							</Button>
							{shareUrl && (
								<Button size={"sm"} variant="outline" onClick={handleCopyLink}>
									<HugeiconsIcon
										icon={isCopied ? CheckmarkCircle02Icon : CopyLinkIcon}
										size={16}
									/>
									{isCopied ? "Copied!" : "Copy Link"}
								</Button>
							)}
						</div>
						<PromptInputSubmit
							className="rounded-full bg-sky-600 hover:bg-sky-700 text-white"
							size={"sm"}
							disabled={!input && !status}
							status={status}
						/>
					</PromptInputFooter>
				</PromptInput>
				<div className="text-xs my-2 text-center text-zinc-700 rounded-lg p-2">
					AI mungkin memberikan informasi yang tidak akurat. Selalu cek
					kebenaran informasi di sumber resmi.
				</div>
			</div>
		</>
	);
}
