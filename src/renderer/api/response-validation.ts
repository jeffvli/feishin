import { AppRoute } from '@ts-rest/core';
import { z } from 'zod';

import { logger } from '/@/renderer/utils/logger';

const responseValidationEnabled = import.meta.env.VITE_VALIDATE_API_RESPONSES === 'true';

type ValidateResponseArgs = {
    controller: string;
    method: string;
    path: string;
    response: unknown;
    route: AppRoute;
    status: number;
    validationResponse?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    if (value === null || typeof value !== 'object') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

const getUnknownPaths = (
    input: unknown,
    parsed: unknown,
    path: (number | string)[] = [],
): string[] => {
    if (Array.isArray(input) && Array.isArray(parsed)) {
        return input.flatMap((item, index) =>
            getUnknownPaths(item, parsed[index], [...path, index]),
        );
    }

    if (!isRecord(input) || !isRecord(parsed)) {
        return [];
    }

    const unknownPaths = Object.keys(input)
        .filter((key) => !(key in parsed))
        .map((key) => [...path, key].join('.'));

    return [
        ...unknownPaths,
        ...Object.keys(parsed).flatMap((key) =>
            getUnknownPaths(input[key], parsed[key], [...path, key]),
        ),
    ];
};

export const validateResponse = ({
    controller,
    method,
    path,
    response,
    route,
    status,
    validationResponse,
}: ValidateResponseArgs): void => {
    if (!responseValidationEnabled) {
        return;
    }

    const schema = route.responses[status] as undefined | z.ZodTypeAny;
    if (!schema) {
        return;
    }

    const candidates =
        validationResponse === undefined ? [response] : [validationResponse, response];
    const parsedCandidates = candidates.map((candidate) => ({
        candidate,
        result: schema.safeParse(candidate),
    }));
    const parsed = parsedCandidates.find(({ result }) => result.success) ?? parsedCandidates[0];
    const endpoint = `${method.toUpperCase()} ${route.path} (${path})`;

    if (!parsed.result.success) {
        logger.warn(`Invalid ${controller} API response`, {
            endpoint,
            issues: parsed.result.error.issues.map((issue) => ({
                code: issue.code,
                ...(issue.code === 'invalid_type' && {
                    expected: issue.expected,
                    received: issue.received,
                }),
                path: issue.path.join('.'),
            })),
            status,
        });
        return;
    }

    const unknownPaths = getUnknownPaths(parsed.candidate, parsed.result.data);
    if (unknownPaths.length > 0) {
        logger.warn(`New fields in ${controller} API response`, {
            endpoint,
            paths: unknownPaths,
            status,
        });
    }
};
