import { ReactNode } from 'react';

import styles from './library-header-bar.module.css';

import { PlayButton, PlayButtonProps } from '/@/renderer/features/shared/components/play-button';
import { Badge, BadgeProps } from '/@/shared/components/badge/badge';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { TextTitle } from '/@/shared/components/text-title/text-title';

interface LibraryHeaderBarProps {
    children: ReactNode;
}

export const LibraryHeaderBar = ({ children }: LibraryHeaderBarProps) => {
    return <div className={styles.headerContainer}>{children}</div>;
};

interface TitleProps {
    children: ReactNode;
}

const HeaderPlayButton = ({ className, ...props }: PlayButtonProps) => {
    return (
        <div className={styles.playButtonContainer}>
            <PlayButton
                className={className}
                {...props}
            />
        </div>
    );
};

const Title = ({ children }: TitleProps) => {
    return (
        <TextTitle
            fw={700}
            order={1}
            overflow="hidden"
        >
            {children}
        </TextTitle>
    );
};

interface HeaderBadgeProps extends BadgeProps {
    isLoading?: boolean;
}

const HeaderBadge = ({ children, isLoading, ...props }: HeaderBadgeProps) => {
    return <Badge {...props}>{isLoading ? <SpinnerIcon /> : children}</Badge>;
};

LibraryHeaderBar.Title = Title;
LibraryHeaderBar.PlayButton = HeaderPlayButton;
LibraryHeaderBar.Badge = HeaderBadge;
