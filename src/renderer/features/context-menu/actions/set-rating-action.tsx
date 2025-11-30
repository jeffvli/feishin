import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { useCurrentServer, useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Rating } from '/@/shared/components/rating/rating';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ServerType } from '/@/shared/types/types';

interface SetRatingActionProps {
    ids: string[];
    itemType: LibraryItem;
}

export const SetRatingAction = ({ ids, itemType }: SetRatingActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = useCurrentServerId();

    const setRatingMutation = useSetRating({});

    const isRatingSupported = useMemo(() => {
        return server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC;
    }, [server?.type]);

    const onRating = (rating: number) => {
        setRatingMutation.mutate({
            apiClientProps: { serverId },
            query: {
                id: ids,
                rating,
                type: itemType,
            },
        });
    };

    if (!isRatingSupported) {
        return null;
    }

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="star"
                    onSelect={(e) => e.preventDefault()}
                    rightIcon="arrowRightS"
                >
                    {t('action.setRating', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                <ContextMenu.Item onSelect={() => onRating(0)}>
                    <Rating preventDefault={false} readOnly stopPropagation={false} value={0} />
                </ContextMenu.Item>
                <ContextMenu.Item onSelect={() => onRating(1)}>
                    <Rating preventDefault={false} readOnly stopPropagation={false} value={1} />
                </ContextMenu.Item>
                <ContextMenu.Item onSelect={() => onRating(2)}>
                    <Rating preventDefault={false} readOnly stopPropagation={false} value={2} />
                </ContextMenu.Item>
                <ContextMenu.Item onSelect={() => onRating(3)}>
                    <Rating preventDefault={false} readOnly stopPropagation={false} value={3} />
                </ContextMenu.Item>
                <ContextMenu.Item onSelect={() => onRating(4)}>
                    <Rating preventDefault={false} readOnly stopPropagation={false} value={4} />
                </ContextMenu.Item>
                <ContextMenu.Item onSelect={() => onRating(5)}>
                    <Rating preventDefault={false} readOnly stopPropagation={false} value={5} />
                </ContextMenu.Item>
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
