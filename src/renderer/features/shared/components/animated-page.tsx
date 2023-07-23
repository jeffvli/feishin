import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './animated-page.module.scss';

interface AnimatedPageProps {
    children: ReactNode;
}

const variants = {
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    initial: { opacity: 0 },
};

export const AnimatedPage = forwardRef(
    ({ children }: AnimatedPageProps, ref: Ref<HTMLDivElement>) => {
        return (
            <motion.main
                ref={ref}
                animate="animate"
                className={styles.animatedPage}
                exit="exit"
                initial="initial"
                transition={{ duration: 0.3, ease: 'easeIn' }}
                variants={variants}
            >
                {children}
            </motion.main>
        );
    },
);
