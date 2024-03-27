import type { Edge } from '../graph/edge';

export type EdgeDrawData = {
    edge: Edge;

    strokeWidth: number;
    drawCommand: string;

    color: string;
    activeColor: string;
};
