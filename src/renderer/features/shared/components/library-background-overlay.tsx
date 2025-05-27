import styles from './library-background-overlay.module.css';

interface LibraryBackgroundOverlayProps {
    backgroundColor?: string;
}

export const LibraryBackgroundOverlay = ({ backgroundColor }: LibraryBackgroundOverlayProps) => {
    return (
        <div
            className={styles.root}
            style={{ backgroundColor }}
        />
    );
};
