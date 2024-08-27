// Inspired by https://github.com/navidrome/navidrome/blob/c530ccf13854e3a840ddf63eef5e2323fbe2827d/ui/src/common/AnchorMe.js
const URL_REGEX =
    /((?:https?:\/\/)?(?:[\w-]{1,32}(?:\.[\w-]{1,32})+)(?:\/[\w\-./?%&=][^.|^\s]*)?)/g;

export const replaceURLWithHTMLLinks = (text: string) => {
    const urlRegex = new RegExp(URL_REGEX, 'g');
    const matches = text.matchAll(urlRegex);
    const elements = [];
    let lastIndex = 0;

    for (const match of matches) {
        const position = match.index!;

        if (position > lastIndex) {
            elements.push(text.substring(lastIndex, position));
        }

        const link = match[0];
        const prefix = link.startsWith('http') ? '' : 'https://';
        elements.push(
            <a
                key={lastIndex}
                href={prefix + link}
                rel="noopener noreferrer"
                target="_blank"
            >
                {link}
            </a>,
        );

        lastIndex = position + link.length;
    }

    if (text.length > lastIndex) {
        elements.push(text.substring(lastIndex));
    }

    return elements;
};
