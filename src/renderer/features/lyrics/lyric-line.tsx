import clsx from 'clsx';
import { ComponentPropsWithoutRef } from 'react';

import styles from './lyric-line.module.css';

import { TextTitle } from '/@/shared/components/text-title/text-title';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
    alignment: 'center' | 'left' | 'right';
    fontSize: number;
    text: string;
}

export const LyricLine = ({ alignment, className, fontSize, text, ...props }: LyricLineProps) => {
    return (
        <TextTitle
            className={clsx(styles.lyricLine, className)}
            style={{
                fontSize,
                textAlign: alignment,
            }}
            {...props}
        >
            {text}
        </TextTitle>
    );
};
