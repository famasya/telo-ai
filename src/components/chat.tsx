import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { ChatMessages } from "@/components/chat-messages";
import type { MyUIMessage } from "@/routes/api/chat";
import { useChat } from "@ai-sdk/react";
import { Quote } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type FormEvent, useState } from "react";

export default function Chat() {
	const [input, setInput] = useState("");
	const { messages, sendMessage, status, regenerate, stop } =
		useChat<MyUIMessage>();

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

	const [suggestionsCache, _setSuggestionsCache] = useState<string[]>([
		"Carikan perda apa saja tentang lingkungan hidup",
		"Ada berapa hibah kendaraan bermotor?",
		"Carikan perda tentang pengadaan barang/jasa",
	]);

	return (
		<div className="flex flex-col h-full w-full mx-auto">
			{/* Fixed Header */}
			<div className="flex-shrink-0 border-b bg-white px-4 py-3">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold text-zinc-900">
							JDIH Trenggalek
						</h1>
						<p className="text-xs text-zinc-500">
							Asisten pencarian peraturan daerah
						</p>
					</div>
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-hidden max-w-4xl mx-auto">
				<ChatMessages
					messages={messages}
					status={status}
					regenerate={regenerate}
				/>
			</div>

			<div className="max-w-4xl mx-auto">
				<h3 className="text-sm font-medium text-zinc-700">Saran pertanyaan</h3>
				<div className="grid grid-cols-3 gap-2">
					{suggestionsCache.map((suggestion, index) => (
						<button
							key={index.toString()}
							type="button"
							onClick={() => setInput(suggestion)}
							className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-900 px-3 py-2 rounded-lg transition-colors whitespace-normal break-words"
						>
							{suggestion}
							<HugeiconsIcon icon={Quote} />
						</button>
					))}
				</div>
			</div>

			{/* Input Area */}
			<div className="flex-shrink-0 p-2 w-full max-w-4xl mx-auto">
				<PromptInput onSubmit={handleSubmit}>
					<PromptInputBody>
						<PromptInputTextarea
							className="bg-white"
							onChange={(e) => setInput(e.target.value)}
							value={input}
							placeholder="Tanyakan tentang peraturan daerah..."
						/>
					</PromptInputBody>
					<PromptInputFooter className="flex justify-end bg-white">
						<PromptInputSubmit
							className="rounded-full bg-sky-600 hover:bg-sky-700 text-white"
							size={"sm"}
							disabled={!input && !status}
							status={status}
						/>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
}
