import type { QueryParameter } from '../models/query-parameters';

export function buildQueryString<T>(parameters: QueryParameter<T>): string {
    const parts: string[] = [];

    if (parameters.sort !== undefined && parameters.sort.length > 0) {
        const options = parameters.sort
            .map((o) =>
                o.desc === true ? `${String(o.property)} DESC` : o.property,
            )
            .join(',');

        parts.push(`sort=${encodeURIComponent(options)}`);
    }

    if (parameters.filters !== undefined && parameters.filters.length > 0) {
        const options = parameters.filters
            .map((f) => `${String(f.property)} ${f.operator} ${f.value}`)
            .join(',');

        parts.push(`filter=${encodeURIComponent(options)}`);
    }

    if (parameters.start !== undefined) {
        parts.push(`start=${parameters.start}`);
    }

    if (parameters.length !== undefined) {
        parts.push(`length=${parameters.length}`);
    }

    return parts.join('&');
}

export function buildUrl<T>(
    url: string,
    parameters?: QueryParameter<T>,
): string {
    const queryString =
        parameters !== undefined ? '?' + buildQueryString(parameters) : '';
    return url + queryString;
}
