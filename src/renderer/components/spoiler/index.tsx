import { ReactNode } from 'react';
import { Spoiler as MantineSpoiler } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import styles from './spoiler.module.scss';

type SpoilerProps = {
    children: ReactNode;
    hideLabel?: boolean;
    initialState?: boolean;
    maxHeight: number;
    showLabel?: ReactNode;
    transitionDuration?: number;
};

export const Spoiler = ({
    hideLabel,
    initialState,
    maxHeight,
    showLabel,
    transitionDuration,
    children,
}: SpoilerProps) => {
    const { t } = useTranslation();

    return (
        <MantineSpoiler
            classNames={{
                content: styles.content,
                control: styles.control,
                root: styles.root,
            }}
            hideLabel={hideLabel ?? t('common.collapse', { postProcess: 'sentenceCase' })}
            initialState={initialState}
            maxHeight={maxHeight ?? 75}
            showLabel={showLabel ?? t('common.expand', { postProcess: 'sentenceCase' })}
            transitionDuration={transitionDuration}
        >
            {children}
        </MantineSpoiler>
    );
};
