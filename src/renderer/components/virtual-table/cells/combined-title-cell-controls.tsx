import React, { MouseEvent } from 'react';
import type { UnstyledButtonProps } from '@mantine/core';
import { RiPlayFill } from 'react-icons/ri';
import styled from 'styled-components';
import { Play } from '/@/renderer/types';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';

type PlayButtonType = UnstyledButtonProps & React.ComponentPropsWithoutRef<'button'>;

const PlayButton = styled.button<PlayButtonType>`
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background-color: rgb(255 255 255);
    border: none;
    border-radius: 50%;
    opacity: 0.8;
    transition: scale 0.1s ease-in-out;

    &:hover {
        opacity: 1;
        scale: 1.1;
    }

    &:active {
        opacity: 1;
        scale: 1;
    }

    svg {
        fill: rgb(0 0 0);
        stroke: rgb(0 0 0);
    }
`;

const ListConverControlsContainer = styled.div`
    position: absolute;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
`;

export const ListCoverControls = ({
    itemData,
    itemType,
    context,
    uniqueId,
}: {
    context: Record<string, any>;
    itemData: any;
    itemType: LibraryItem;
    uniqueId?: string;
}) => {
    const playButtonBehavior = usePlayButtonBehavior();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const isQueue = Boolean(context?.isQueue);

    const handlePlay = async (e: MouseEvent<HTMLButtonElement>, playType?: Play) => {
        e.preventDefault();
        e.stopPropagation();

        handlePlayQueueAdd?.({
            byItemType: {
                id: [itemData.id],
                type: itemType,
            },
            playType: playType || playButtonBehavior,
        });
    };

    const handlePlayFromQueue = () => {
        context.handleDoubleClick({
            data: {
                uniqueId,
            },
        });
    };

    return (
        <>
            <ListConverControlsContainer className="card-controls">
                <PlayButton onClick={isQueue ? handlePlayFromQueue : handlePlay}>
                    <RiPlayFill size={20} />
                </PlayButton>
            </ListConverControlsContainer>
        </>
    );
};
