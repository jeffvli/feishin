import { Center, Flex } from '@mantine/core';
import { MouseEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    RiAddBoxFill,
    RiAddCircleFill,
    RiAlbumFill,
    RiPlayFill,
    RiPlayListFill,
    RiShuffleFill,
    RiUserVoiceFill,
} from 'react-icons/ri';
import styled from 'styled-components';

import { Button, Text } from '/@/renderer/components';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play, PlayQueueAddOptions } from '/@/shared/types/types';

const Item = styled(Flex)``;

const ItemGrid = styled.div<{ height: number }>`
    display: grid;
    grid-template-areas: 'image info';
    grid-template-rows: 1fr;
    grid-template-columns: ${(props) => props.height}px minmax(0, 1fr);
    grid-auto-columns: 1fr;
    gap: 0.5rem;
    width: 100%;
    max-width: 100%;
    height: 100%;
    letter-spacing: 0.5px;
`;

const ImageWrapper = styled.div`
    display: flex;
    grid-area: image;
    align-items: center;
    justify-content: center;
    height: 100%;
`;

const MetadataWrapper = styled.div`
    display: flex;
    flex-direction: column;
    grid-area: info;
    justify-content: center;
    width: 100%;
`;

const StyledImage = styled.img<{ placeholder?: string }>`
    object-fit: var(--image-fit);
    border-radius: 4px;
`;

const ActionsContainer = styled(Flex)``;

interface LibraryCommandItemProps {
    disabled?: boolean;
    handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
    id: string;
    imageUrl: null | string;
    itemType: LibraryItem;
    subtitle?: string;
    title?: string;
}

export const LibraryCommandItem = ({
    disabled,
    handlePlayQueueAdd,
    id,
    imageUrl,
    itemType,
    subtitle,
    title,
}: LibraryCommandItemProps) => {
    const { t } = useTranslation();
    let Placeholder = RiAlbumFill;

    switch (itemType) {
        case LibraryItem.ALBUM:
            Placeholder = RiAlbumFill;
            break;
        case LibraryItem.ALBUM_ARTIST:
            Placeholder = RiUserVoiceFill;
            break;
        case LibraryItem.ARTIST:
            Placeholder = RiUserVoiceFill;
            break;
        case LibraryItem.PLAYLIST:
            Placeholder = RiPlayListFill;
            break;
        default:
            Placeholder = RiAlbumFill;
            break;
    }

    const handlePlay = useCallback(
        (e: MouseEvent, id: string, playType: Play) => {
            e.stopPropagation();
            handlePlayQueueAdd?.({
                byItemType: {
                    id: [id],
                    type: itemType,
                },
                playType,
            });
        },
        [handlePlayQueueAdd, itemType],
    );

    return (
        <Item
            gap="xl"
            justify="space-between"
            style={{ height: '40px', width: '100%' }}
        >
            <ItemGrid height={40}>
                <ImageWrapper>
                    {imageUrl ? (
                        <StyledImage
                            alt="cover"
                            height={40}
                            placeholder="var(--placeholder-bg)"
                            src={imageUrl}
                            style={{}}
                            width={40}
                        />
                    ) : (
                        <Center
                            style={{
                                background: 'var(--placeholder-bg)',
                                borderRadius: 'var(--card-default-radius)',
                                height: `${40}px`,
                                width: `${40}px`,
                            }}
                        >
                            <Placeholder
                                color="var(--placeholder-fg)"
                                size={35}
                            />
                        </Center>
                    )}
                </ImageWrapper>
                <MetadataWrapper>
                    <Text overflow="hidden">{title}</Text>
                    <Text
                        $secondary
                        overflow="hidden"
                    >
                        {subtitle}
                    </Text>
                </MetadataWrapper>
            </ItemGrid>
            <ActionsContainer
                align="center"
                gap="sm"
                justify="flex-end"
            >
                <Button
                    compact
                    disabled={disabled}
                    onClick={(e) => handlePlay(e, id, Play.NOW)}
                    size="md"
                    tooltip={{
                        label: t('player.play', { postProcess: 'sentenceCase' }),
                        openDelay: 500,
                    }}
                    variant="default"
                >
                    <RiPlayFill />
                </Button>
                {itemType !== LibraryItem.SONG && (
                    <Button
                        compact
                        disabled={disabled}
                        onClick={(e) => handlePlay(e, id, Play.SHUFFLE)}
                        size="md"
                        tooltip={{
                            label: t('player.shuffle', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                    >
                        <RiShuffleFill />
                    </Button>
                )}
                <Button
                    compact
                    disabled={disabled}
                    onClick={(e) => handlePlay(e, id, Play.LAST)}
                    size="md"
                    tooltip={{
                        label: t('player.addLast', { postProcess: 'sentenceCase' }),

                        openDelay: 500,
                    }}
                    variant="default"
                >
                    <RiAddBoxFill />
                </Button>
                <Button
                    compact
                    disabled={disabled}
                    onClick={(e) => handlePlay(e, id, Play.NEXT)}
                    size="md"
                    tooltip={{
                        label: t('player.addNext', { postProcess: 'sentenceCase' }),
                        openDelay: 500,
                    }}
                    variant="default"
                >
                    <RiAddCircleFill />
                </Button>
            </ActionsContainer>
        </Item>
    );
};
