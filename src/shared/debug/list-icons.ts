/**
 * List all the existing icons in the context menu.
 */
export function listIcons(): void {
    const items = Object.entries(Spicetify.SVGIcons).map(([iconName, icon]) => {
        return new Spicetify.ContextMenu.Item(
            iconName,
            () => {},
            () => true,
            `<svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">${icon}</svg>` as any,
        );
    });

    new Spicetify.ContextMenu.SubMenu('Icons', items, () => true).register();
}
