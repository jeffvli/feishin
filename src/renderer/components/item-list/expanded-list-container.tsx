import { ReactNode } from 'react';

import styles from './expanded-list-container.module.css';

const EXPANDED_HEIGHT = 300;

export interface ExpandedListContainerProps {
    children: ReactNode;
}

export const ExpandedListContainer = ({ children }: ExpandedListContainerProps) => {
    return (
        <div
            className={styles.listExpandedContainer}
            style={{
                height: EXPANDED_HEIGHT,
                overflow: 'auto',
            }}
        >
            {children}
        </div>
    );
};
