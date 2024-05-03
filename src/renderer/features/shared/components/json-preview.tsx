interface JsonPreviewProps {
    value: string | Record<string, any>;
}

export const JsonPreview = ({ value }: JsonPreviewProps) => {
    return <pre style={{ userSelect: 'all' }}>{JSON.stringify(value, null, 2)}</pre>;
};
