import { motion } from 'motion/react';
import { CSSProperties, ReactNode } from 'react';

import { animationVariants } from '/@/shared/components/animations/animation-variants';

interface FadeInProps {
    children: ReactNode;
    style?: CSSProperties;
}

export const FadeIn = ({ children, style }: FadeInProps) => {
    return (
        <motion.div
            animate="show"
            initial="hidden"
            style={style}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            variants={animationVariants.fadeInUp}
        >
            {children}
        </motion.div>
    );
};
