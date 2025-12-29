import { SharedChat } from "@/components/shared-chat";
import { getSharedMessages } from "@/lib/share";
import type { ChatUIMessage } from "@/routes/api/chat";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import superjson from "superjson";

export const Route = createFileRoute("/share/$id")({
	component: SharePage,
});

function SharePage() {
	const params = Route.useParams();
	const id = params.id;

	const {
		data: messages,
		isLoading,
		error,
	} = useQuery<ChatUIMessage[]>({
		queryKey: ["shared-chat", id],
		queryFn: async () => {
			const result = await getSharedMessages({ data: { shareId: id } });
			return superjson.parse<ChatUIMessage[]>(result);
		},
		retry: 1,
		staleTime: Number.POSITIVE_INFINITY,
	});

	return <SharedChat messages={messages} isLoading={isLoading} error={error} />;
}
