import { Text as MantineText, TextProps as MantineTextProps } from '@mantine/core';
import clsx from 'clsx';
import { ComponentPropsWithoutRef, ReactNode, useMemo } from 'react';

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

export const BaseText = ({
    children,
    font,
    isLink,
    isMuted,
    isNoSelect,
    overflow,
    weight,
    ...rest
}: TextProps) => {
    const classNames = useMemo(
        () => ({
            root: clsx(styles.root, {
                [styles.link]: isLink,
                [styles.muted]: isMuted,
                [styles.noSelect]: isNoSelect,
                [styles.overflowHidden]: overflow === 'hidden',
            }),
        }),
        [isLink, isMuted, isNoSelect, overflow],
    );

    const style = useMemo(
        () =>
            ({
                '--font-family': font,
            }) as React.CSSProperties,
        [font],
    );

    return (
        <MantineText classNames={classNames} component="div" fw={weight} style={style} {...rest}>
            {children}
        </MantineText>
    );
};

export const Text = createPolymorphicComponent<'div', TextProps>(BaseText);
