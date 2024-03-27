import type { ErrorResponse } from '../models/error-response';
import type { GraphQLResponse } from '../models/response';

export function IsErrorResponse(
    response: GraphQLResponse<any>,
): response is ErrorResponse {
    return (response as any).errors !== undefined;
}

export function ThrowWithErrorMessage(response: ErrorResponse): never {
    throw new Error(response.errors.map((e) => e.message).join('\n'));
}
