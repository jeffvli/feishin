import sanitizeHtml, { IOptions, simpleTransform } from 'sanitize-html';

const SANITIZE_OPTIONS: IOptions = {
    allowedAttributes: {
        a: ['href', 'rel', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedTags: ['a', 'b', 'div', 'em', 'i', 'p', 'strong'],
    transformTags: {
        a: simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
};

export const sanitize = (text: string): string => {
    return sanitizeHtml(text, SANITIZE_OPTIONS);
};
