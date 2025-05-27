import { Text as MantineText, TextProps as MantineTextProps } from '@mantine/core';
import clsx from 'clsx';
import { ComponentPropsWithoutRef, ReactNode } from 'react';

import styles from './text.module.css';

import { createPolymorphicComponent } from '/@/shared/utils/create-polymorphic-component';

export interface TextProps extends MantineTextDivProps {
    children?: ReactNode;
    font?: Font;
    isLink?: boolean;
    isMuted?: boolean;
    isNoSelect?: boolean;
    overflow?: 'hidden' | 'visible';
    to?: string;
    weight?: number;
}

type Font = 'Epilogue' | 'Gotham' | 'Inter' | 'Poppins';

type MantineTextDivProps = ComponentPropsWithoutRef<'div'> & MantineTextProps;

export const _Text = ({
    children,
    font,
    isLink,
    isMuted,
    isNoSelect,
    overflow,
    ...rest
}: TextProps) => {
    return (
        <MantineText
            className={clsx(styles.root, {
                [styles.link]: isLink,
                [styles.muted]: isMuted,
                [styles.noSelect]: isNoSelect,
                [styles.overflowHidden]: overflow === 'hidden',
            })}
            component="div"
            style={
                {
                    '--font-family': font,
                } as React.CSSProperties
            }
            {...rest}
        >
            {children}
        </MantineText>
    );
};

export const Text = createPolymorphicComponent<'div', TextProps>(_Text);
