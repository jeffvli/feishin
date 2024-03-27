import type { GraphQLResponse } from './response';

export type ErrorResponse = GraphQLResponse<null> & {
    errors: {
        extensions: { classification: string }[];
        message: string;
        path?: string[];
        locations?: { line: number; column: number }[];
    }[];
};
