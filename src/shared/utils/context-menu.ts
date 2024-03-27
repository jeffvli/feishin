/**
 * Get the element currently selected by the context menu.
 * @returns The selected element.
 */
export function getSelectedElement(): Element | null {
    return document.querySelector('[data-context-menu-open="true"]');
}

/**
 * Get the display name of the element currently selected by the context menu.
 * @returns The selected element's name.
 */
export function getSelectedElementName(): string | null {
    const selectedElement = getSelectedElement();

    if (selectedElement === null) {
        return '';
    }

    let name: string | null = null;

    if (selectedElement.matches('.main-trackList-selected')) {
        // Track row: get the name from div
        const trackTitle = selectedElement.querySelector(
            '.main-trackList-rowTitle',
        );
        name = trackTitle?.textContent ?? null;
    } else if (selectedElement.matches('.main-entityHeader-title')) {
        // Title of playlist, album, etc. from the details page header
        name = selectedElement.textContent;
    } else {
        // Artist or album name selected from a track row
        const link = selectedElement.matches('a[draggable]')
            ? selectedElement
            : selectedElement.querySelector('a[draggable]');
        name = link?.textContent ?? null;
    }

    return name;
}
