import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import type { MyUIMessage } from "@/routes/api/chat";
import type { ChatRequestOptions, ChatStatus } from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";

interface ChatMessagesProps {
	messages: MyUIMessage[];
	status: ChatStatus;
	regenerate: (options?: ChatRequestOptions) => void;
}

export function ChatMessages({
	messages,
	status,
	regenerate,
}: ChatMessagesProps) {
	return (
		<Conversation className="h-full">
			<ConversationContent>
				{messages.map((message) => (
					<div key={message.id}>
						{message.parts.map((part, i) => {
							switch (part.type) {
								case "text":
									return (
										<Message key={`${message.id}-${i}`} from={message.role}>
											<MessageContent>
												<MessageResponse>{part.text}</MessageResponse>
											</MessageContent>
											{message.role === "assistant" && (
												<MessageActions>
													<MessageAction
														onClick={() => regenerate()}
														label="Retry"
													>
														<RefreshCcwIcon className="size-3" />
													</MessageAction>
													<MessageAction
														onClick={() =>
															navigator.clipboard.writeText(part.text)
														}
														label="Copy"
													>
														<CopyIcon className="size-3" />
													</MessageAction>
												</MessageActions>
											)}
										</Message>
									);
								case "reasoning":
									return (
										<Reasoning
											key={`${message.id}-${i}`}
											className="w-full bg-gradient-to-b from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200"
											isStreaming={
												status === "streaming" &&
												i === message.parts.length - 1 &&
												message.id === messages.at(-1)?.id
											}
										>
											<ReasoningTrigger />
											<ReasoningContent className="text-black">
												{part.text}
											</ReasoningContent>
										</Reasoning>
									);
								case "tool-documentSearch":
									// Tool calls are displayed in the DocumentSources component
									return null;
								case "tool-documentRelationGraph":
									// Tool calls are displayed in the DocumentSources component
									return null;
								default:
									return null;
							}
						})}
					</div>
				))}
				{status === "submitted" && <Loader />}
			</ConversationContent>
			<ConversationScrollButton />
		</Conversation>
	);
}
