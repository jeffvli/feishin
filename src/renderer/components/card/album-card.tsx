import { useCallback } from 'react';
import { Center } from '@mantine/core';
import { RiAlbumFill } from 'react-icons/ri';
import { generatePath, useNavigate } from 'react-router';
import { SimpleImg } from 'react-simple-img';
import styled from 'styled-components';
import type { CardRow, CardRoute, Play, PlayQueueAddOptions } from '/@/renderer/types';
import { Skeleton } from '/@/renderer/components/skeleton';
import { CardControls } from '/@/renderer/components/card/card-controls';
import { Album, AlbumArtist, Artist, LibraryItem } from '/@/renderer/api/types';
import { CardRows } from '/@/renderer/components/card/card-rows';

const CardWrapper = styled.div<{
    link?: boolean;
}>`
    padding: 1rem;
    cursor: ${({ link }) => link && 'pointer'};
    background: var(--card-default-bg);
    border-radius: var(--card-default-radius);
    transition:
        border 0.2s ease-in-out,
        background 0.2s ease-in-out;

    &:hover {
        background: var(--card-default-bg-hover);
    }

    &:hover div {
        opacity: 1;
    }

    &:hover * {
        &::before {
            opacity: 0.5;
        }
    }

    &:focus-visible {
        outline: 1px solid #fff;
    }
`;

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
    padding: 0;
    border-radius: var(--card-default-radius);
`;

const ImageSection = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    border-radius: var(--card-default-radius);

    &::before {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        content: '';
        user-select: none;
        background: linear-gradient(0deg, rgb(0 0 0 / 100%) 35%, rgb(0 0 0 / 0%) 100%);
        opacity: 0;
        transition: all 0.2s ease-in-out;
    }
`;

const Image = styled(SimpleImg)`
    border-radius: var(--card-default-radius);
    box-shadow: 2px 2px 10px 2px rgb(0 0 0 / 20%);
`;

const ControlsContainer = styled.div`
    position: absolute;
    bottom: 0;
    z-index: 50;
    width: 100%;
    opacity: 0;
    transition: all 0.2s ease-in-out;
`;

const DetailSection = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div<{ $secondary?: boolean }>`
    width: 100%;
    max-width: 100%;
    height: 22px;
    padding: 0 0.2rem;
    overflow: hidden;
    color: ${({ $secondary }) => ($secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)')};
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
`;

interface BaseGridCardProps {
    controls: {
        cardRows: CardRow<Album | Artist | AlbumArtist>[];
        itemType: LibraryItem;
        playButtonBehavior: Play;
        route: CardRoute;
    };
    data: any;
    handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
    loading?: boolean;
    size: number;
}

export const AlbumCard = ({
    loading,
    size,
    handlePlayQueueAdd,
    data,
    controls,
}: BaseGridCardProps) => {
    const navigate = useNavigate();
    const { itemType, cardRows, route } = controls;

    const handleNavigate = useCallback(() => {
        navigate(
            generatePath(
                route.route,
                route.slugs?.reduce((acc, slug) => {
                    return {
                        ...acc,
                        [slug.slugProperty]: data[slug.idProperty],
                    };
                }, {}),
            ),
        );
    }, [data, navigate, route.route, route.slugs]);

    if (!loading) {
        return (
            <CardWrapper
                link
                onClick={handleNavigate}
            >
                <StyledCard>
                    <ImageSection>
                        {data?.imageUrl ? (
                            <Image
                                animationDuration={0.3}
                                height={size}
                                imgStyle={{ objectFit: 'cover' }}
                                placeholder={data?.imagePlaceholderUrl || 'var(--card-default-bg)'}
                                src={data?.imageUrl}
                                width={size}
                            />
                        ) : (
                            <Center
                                sx={{
                                    background: 'var(--placeholder-bg)',
                                    borderRadius: 'var(--card-default-radius)',
                                    height: `${size}px`,
                                    width: `${size}px`,
                                }}
                            >
                                <RiAlbumFill
                                    color="var(--placeholder-fg)"
                                    size={35}
                                />
                            </Center>
                        )}
                        <ControlsContainer>
                            <CardControls
                                handlePlayQueueAdd={handlePlayQueueAdd}
                                itemData={data}
                                itemType={itemType}
                            />
                        </ControlsContainer>
                    </ImageSection>
                    <DetailSection>
                        <CardRows
                            data={data}
                            rows={cardRows}
                        />
                    </DetailSection>
                </StyledCard>
            </CardWrapper>
        );
    }

    return (
        <CardWrapper>
            <StyledCard style={{ alignItems: 'center', display: 'flex' }}>
                <Skeleton
                    visible
                    height={size}
                    radius="sm"
                    width={size}
                >
                    <ImageSection />
                </Skeleton>
                <DetailSection style={{ width: '100%' }}>
                    {cardRows.map((_row: CardRow<Album>, index: number) => (
                        <Skeleton
                            visible
                            height={15}
                            my={3}
                            radius="md"
                            width={!data ? (index > 0 ? '50%' : '90%') : '100%'}
                        >
                            <Row />
                        </Skeleton>
                    ))}
                </DetailSection>
            </StyledCard>
        </CardWrapper>
    );
};
