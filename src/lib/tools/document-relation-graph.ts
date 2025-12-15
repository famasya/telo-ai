import { tool } from "ai";
import { z } from "zod";

const documentRelationGraphSchema = z.object({
	documents: z
		.array(z.string())
		.describe("Array of document filenames (e.g., ['doc-a.pdf', 'doc-b.pdf'])"),
	relationships: z
		.array(
			z.object({
				from: z.string().describe("Source document filename"),
				to: z.string().describe("Target document filename"),
				type: z
					.string()
					.describe(
						"Relationship type (free-form label, e.g., 'mengubah', 'mencabut', 'melengkapi')",
					),
			}),
		)
		.describe("Array of relationship definitions between documents"),
});

type DocumentRelationGraphInput = z.infer<typeof documentRelationGraphSchema>;

interface GraphNode {
	id: string;
	position: { x: number; y: number };
	data: {
		label: string;
		filename: string;
	};
	draggable?: boolean;
}

interface GraphEdge {
	id: string;
	source: string;
	target: string;
	label?: string;
	animated?: boolean;
}

/**
 * Apply hierarchical layout to nodes based on relationships
 * Nodes are arranged in layers from left to right based on their dependencies
 */
function applyHierarchicalLayout(
	documents: string[],
	relationships: DocumentRelationGraphInput["relationships"],
): GraphNode[] {
	// Build adjacency map to understand dependencies
	const incomingEdges = new Map<string, number>();
	const outgoingEdges = new Map<string, Set<string>>();

	for (const doc of documents) {
		incomingEdges.set(doc, 0);
		outgoingEdges.set(doc, new Set());
	}

	for (const rel of relationships) {
		incomingEdges.set(rel.to, (incomingEdges.get(rel.to) || 0) + 1);
		outgoingEdges.get(rel.from)?.add(rel.to);
	}

	// Assign nodes to layers using topological sorting
	const layers: string[][] = [];
	const assigned = new Set<string>();
	const queue = documents.filter((doc) => incomingEdges.get(doc) === 0);

	// Start with nodes that have no incoming edges (source nodes)
	while (queue.length > 0) {
		const currentLayer = [...queue];
		queue.length = 0;
		layers.push(currentLayer);

		for (const node of currentLayer) {
			assigned.add(node);
			for (const target of outgoingEdges.get(node) || []) {
				const count = incomingEdges.get(target) || 0;
				incomingEdges.set(target, count - 1);
				if (count - 1 === 0 && !assigned.has(target)) {
					queue.push(target);
				}
			}
		}
	}

	// Add remaining nodes (cycles or disconnected) to final layer
	const remaining = documents.filter((doc) => !assigned.has(doc));
	if (remaining.length > 0) {
		layers.push(remaining);
	}

	// Position nodes
	const LAYER_WIDTH = 300; // Horizontal spacing between layers
	const NODE_HEIGHT = 120; // Vertical spacing between nodes

	const nodes: GraphNode[] = [];
	for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
		const layer = layers[layerIndex];
		const layerHeight = (layer.length - 1) * NODE_HEIGHT;
		const startY = -layerHeight / 2; // Center the layer vertically

		for (let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
			const filename = layer[nodeIndex];
			nodes.push({
				id: filename,
				position: {
					x: layerIndex * LAYER_WIDTH,
					y: startY + nodeIndex * NODE_HEIGHT,
				},
				data: {
					label: filename.replace(/\.[^/.]+$/, ""), // Remove file extension
					filename: filename,
				},
				draggable: true,
			});
		}
	}

	return nodes;
}

/**
 * Simple grid layout fallback when there are no relationships
 */
function applyGridLayout(documents: string[]): GraphNode[] {
	const GRID_COLS = Math.ceil(Math.sqrt(documents.length));
	const GRID_SPACING_X = 250;
	const GRID_SPACING_Y = 150;

	return documents.map((filename, index) => ({
		id: filename,
		position: {
			x: (index % GRID_COLS) * GRID_SPACING_X,
			y: Math.floor(index / GRID_COLS) * GRID_SPACING_Y,
		},
		data: {
			label: filename.replace(/\.[^/.]+$/, ""),
			filename: filename,
		},
		draggable: true,
	}));
}

export const documentRelationGraph = tool({
	description:
		"Generate a visual relationship graph between documents. Returns a graph in @xyflow/react format showing documents as nodes and relationships as edges. Use this when users ask to visualize document relationships, dependencies, or connections.",
	inputSchema: documentRelationGraphSchema,
	execute: async ({ documents, relationships }) => {
		// Validate that all relationship references exist in documents array
		const documentSet = new Set(documents);
		const invalidReferences = relationships.filter(
			(rel) => !documentSet.has(rel.from) || !documentSet.has(rel.to),
		);

		if (invalidReferences.length > 0) {
			throw new Error(
				`Invalid document references in relationships: ${invalidReferences
					.map((r) => `${r.from} -> ${r.to}`)
					.join(", ")}`,
			);
		}

		// Generate nodes with layout
		const nodes: GraphNode[] =
			relationships.length > 0
				? applyHierarchicalLayout(documents, relationships)
				: applyGridLayout(documents);

		// Generate edges
		const shouldAnimate = nodes.length <= 50; // Disable animations for large graphs
		const edges: GraphEdge[] = relationships.map((rel, index) => ({
			id: `e-${rel.from}-${rel.to}-${index}`,
			source: rel.from,
			target: rel.to,
			label: rel.type,
			animated: shouldAnimate,
		}));

		return {
			nodes,
			edges,
			metadata: {
				documentCount: documents.length,
				relationshipCount: relationships.length,
				layoutAlgorithm: relationships.length > 0 ? "hierarchical" : "grid",
			},
		};
	},
});
