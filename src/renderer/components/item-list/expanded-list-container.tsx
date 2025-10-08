import { motion, Variants } from 'motion/react';
import { ReactNode } from 'react';

import styles from './expanded-list-container.module.css';

const expandedAnimationVariants: Variants = {
    hidden: {
        height: 0,
        minHeight: 0,
    },
    show: {
        minHeight: '300px',
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
};

export const ExpandedListContainer = ({ children }: { children: ReactNode }) => {
    return (
        <motion.div
            animate="show"
            className={styles.listExpandedContainer}
            exit="hidden"
            initial="hidden"
            variants={expandedAnimationVariants}
        >
            {children}
        </motion.div>
    );
};
