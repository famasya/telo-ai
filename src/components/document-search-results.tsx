import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { BUCKET_DOMAIN } from "@/lib/constants";
import { Document } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Streamdown } from "@phaserjs/streamdown-lite";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface DocumentSearchResultsProps {
	output: AutoRagSearchResponse;
	query: string;
}

export function DocumentSearchResults({
	output,
	query,
}: DocumentSearchResultsProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const documents = output?.data || [];

	if (!documents || documents.length === 0) {
		return null;
	}

	return (
		<>
			<Button
				variant={"outline"}
				size={"sm"}
				onClick={() => setIsDialogOpen(true)}
			>
				<HugeiconsIcon icon={Document} /> Ditemukan {documents.length} dokumen
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Hasil Pencarian Dokumen</DialogTitle>
						<DialogDescription>
							Hasil pencarian untuk: {query}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="text-sm text-zinc-700">
							Ditemukan{" "}
							<span className="font-semibold">{documents.length}</span> dokumen
						</div>
						<div className="space-y-2 max-h-[400px] overflow-y-auto">
							{documents.map((doc, idx) => {
								const title = doc.filename || "Unknown";
								const link = `${BUCKET_DOMAIN}/${doc.filename}` || "";
								const score = doc.score ? doc.score.toFixed(3) : null;

								return (
									<div
										key={`dialog-doc-${doc.file_id}-${idx}`}
										className="p-3 border border-zinc-200 rounded-lg transition-colors"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm text-zinc-900 truncate">
													{title}
												</div>
												{link && (
													<a
														href={link}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-blue-600 hover:text-blue-700 hover:underline break-all"
													>
														{link}
													</a>
												)}
											</div>
											{score && (
												<Badge variant={"default"}>
													Score: {score}
												</Badge>
											)}
										</div>
										<div className="mt-2 text-sm text-zinc-700 bg-zinc-100 p-2">
											<Streamdown>
												{doc.content?.[0].text}
											</Streamdown>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
