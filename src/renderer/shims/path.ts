export const join = (...parts: string[]): string =>
    parts
        .filter(Boolean)
        .map((part, index) =>
            index === 0 ? part.replace(/\/+$/u, '') : part.replace(/^\/+|\/+$/gu, ''),
        )
        .join('/');

export default { join };
