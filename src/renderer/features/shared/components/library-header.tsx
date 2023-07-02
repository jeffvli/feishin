import { Center, Group } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { forwardRef, ReactNode, Ref } from 'react';
import { RiAlbumFill } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { SimpleImg } from 'react-simple-img';
import styled from 'styled-components';
import { LibraryItem } from '/@/renderer/api/types';
import { Text, TextTitle } from '/@/renderer/components';
import { useContainerQuery } from '/@/renderer/hooks';

const HeaderContainer = styled.div<{ imageSize: number }>`
    position: relative;
    display: grid;
    grid-auto-columns: 1fr;
    grid-template-areas: 'image info';
    grid-template-rows: 1fr;
    grid-template-columns: ${(props) => props.imageSize + 25}px minmax(0, 1fr);
    gap: 0.5rem;
    width: 100%;
    max-width: 100%;
    height: 30vh;
    min-height: 340px;
    max-height: 500px;
    padding: 5rem 2rem 2rem;
`;

const CoverImageWrapper = styled.div`
    z-index: 15;
    display: flex;
    grid-area: image;
    align-items: flex-end;
    justify-content: center;
    height: 100%;
    filter: drop-shadow(0 0 8px rgb(0, 0, 0, 50%));
`;

const MetadataWrapper = styled.div`
    z-index: 15;
    display: flex;
    flex-direction: column;
    grid-area: info;
    justify-content: flex-end;
    width: 100%;
`;

const StyledImage = styled(SimpleImg)`
    img {
        object-fit: cover;
    }
`;

const BackgroundImage = styled.div<{ background: string }>`
    position: absolute;
    top: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    background: ${(props) => props.background};
`;

const BackgroundImageOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(25, 26, 28, 5%), var(--main-bg)),
        var(--background-noise);
`;

interface LibraryHeaderProps {
    background: string;
    children?: ReactNode;
    imagePlaceholderUrl?: string | null;
    imageUrl?: string | null;
    item: { route: string; type: LibraryItem };
    title: string;
}

export const LibraryHeader = forwardRef(
    (
        { imageUrl, imagePlaceholderUrl, background, title, item, children }: LibraryHeaderProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const cq = useContainerQuery();
        const mergedRef = useMergedRef(ref, cq.ref);
        const titleSize = cq.isXl
            ? '6rem'
            : cq.isLg
            ? '5.5rem'
            : cq.isMd
            ? '5rem'
            : cq.isSm
            ? '4.5rem'
            : '3rem';

        const imageSize = cq.isLg ? 250 : cq.isMd ? 225 : cq.isSm ? 200 : 175;

        return (
            <HeaderContainer
                ref={mergedRef}
                imageSize={imageSize}
            >
                <BackgroundImage background={background} />
                <BackgroundImageOverlay />
                <CoverImageWrapper>
                    {imageUrl ? (
                        <StyledImage
                            alt="cover"
                            height={imageSize}
                            placeholder={imagePlaceholderUrl || 'var(--placeholder-bg)'}
                            src={imageUrl}
                            width={imageSize}
                        />
                    ) : (
                        <Center
                            sx={{
                                background: 'var(--placeholder-bg)',
                                borderRadius: 'var(--card-default-radius)',
                                height: `${imageSize}px`,
                                width: `${imageSize}px`,
                            }}
                        >
                            <RiAlbumFill
                                color="var(--placeholder-fg)"
                                size={35}
                            />
                        </Center>
                    )}
                </CoverImageWrapper>
                <MetadataWrapper>
                    <Group>
                        <Text
                            $link
                            component={Link}
                            to={item.route}
                            tt="uppercase"
                            weight={600}
                        >
                            {item.type}
                        </Text>
                    </Group>
                    <TextTitle
                        lh={1.15}
                        lineClamp={2}
                        overflow="hidden"
                        pb={cq.isXs ? '0' : cq.isSm ? '0.2rem' : '0.36rem'}
                        sx={{ fontSize: titleSize, overflow: 'hidden' }}
                        weight={900}
                    >
                        {title}
                    </TextTitle>
                    {children}
                </MetadataWrapper>
            </HeaderContainer>
        );
    },
);
