import { ReactNode } from 'react';

import styles from './library-container.module.css';

interface LibraryContainerProps {
    children: ReactNode;
}

export const LibraryContainer = ({ children }: LibraryContainerProps) => {
    return <div className={styles.container}>{children}</div>;
};
