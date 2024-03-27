export function getId(uri: Spicetify.URI): string | null {
    return (uri as any)._base62Id ?? uri.id ?? null;
}
