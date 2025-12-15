import { Canvas } from "@/components/ai-elements/canvas";
import { Edge } from "@/components/ai-elements/edge";
import { Node, NodeHeader, NodeTitle } from "@/components/ai-elements/node";
import type { ToolUIPart } from "ai";

interface DocumentRelationGraphRendererProps {
	part: ToolUIPart;
}

// Custom node component for documents
const DocumentNode = ({
	data,
}: {
	data: { label: string; filename: string };
}) => (
	<Node handles={{ target: true, source: true }}>
		<NodeHeader>
			<NodeTitle className="text-sm">{data.label}</NodeTitle>
		</NodeHeader>
	</Node>
);

export function DocumentRelationGraphRenderer({
	part,
}: DocumentRelationGraphRendererProps) {
	if (part.state !== "output-available") {
		return null;
	}

	const { nodes, edges, metadata } = part.output as {
		nodes: Array<{
			id: string;
			position: { x: number; y: number };
			data: { label: string; filename: string };
		}>;
		edges: Array<{
			id: string;
			source: string;
			target: string;
			label?: string;
			animated?: boolean;
		}>;
		metadata?: {
			documentCount: number;
			relationshipCount: number;
			layoutAlgorithm: string;
		};
	};

	const nodeTypes = {
		default: DocumentNode,
	};

	const edgeTypes = {
		default: Edge.Animated,
	};

	return (
		<div className="w-full my-4">
			<div className="w-full h-[500px] border rounded-lg overflow-hidden bg-background">
				<Canvas
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView
					attributionPosition="bottom-left"
					nodesDraggable={true}
					nodesConnectable={false}
					elementsSelectable={true}
				/>
			</div>
			{metadata && (
				<div className="text-xs text-muted-foreground mt-2 px-1">
					{metadata.documentCount} document
					{metadata.documentCount !== 1 ? "s" : ""},{" "}
					{metadata.relationshipCount} relationship
					{metadata.relationshipCount !== 1 ? "s" : ""} •{" "}
					{metadata.layoutAlgorithm} layout
				</div>
			)}
		</div>
	);
}
