import Chat from "@/components/chat";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/")({
	validateSearch: z.object({
		session: z.string().optional(),
	}),
	loaderDeps: ({ search }) => ({ session: search.session }),
	component: Home,
});

function Home() {
	return <Chat />;
}
