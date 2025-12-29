import { ChatMessages } from "@/components/chat-messages";
import { NotFound } from "@/components/not-found";
import type { ChatUIMessage } from "@/routes/api/chat";
import { Link01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface SharedChatProps {
	messages: ChatUIMessage[] | undefined;
	isLoading: boolean;
	error: Error | null;
}

export function SharedChat({ messages, isLoading, error }: SharedChatProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<p className="text-lg text-gray-600">
						Loading shared conversation...
					</p>
				</div>
			</div>
		);
	}

	if (error || !messages || messages.length === 0) {
		return (
			<div className="flex items-center justify-center h-full max-w-4xl mx-auto p-4">
				<NotFound>
					<p className="text-lg font-semibold">Shared conversation not found</p>
					<p className="text-sm mt-2 text-gray-600">
						This share link may be invalid or the conversation may have been
						removed.
					</p>
				</NotFound>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-6rem)] w-full">
			{/* Banner */}
			<div className="flex-shrink-0">
				<div className="flex items-center justify-between gap-4 max-w-4xl mx-auto bg-blue-50 p-4 rounded-lg">
					<div className="flex items-center gap-2">
						<HugeiconsIcon
							icon={Link01Icon}
							size={20}
							className="text-blue-600"
						/>
						<div>
							<p className="text-sm font-semibold text-blue-900">
								Percakapan yang Dibagikan
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 w-full overflow-auto">
				<div className="max-w-4xl mx-auto">
					<ChatMessages
						messages={messages}
						status="ready"
						showRegenerate={false}
						regenerate={() => {}}
					/>
				</div>
			</div>
		</div>
	);
}
