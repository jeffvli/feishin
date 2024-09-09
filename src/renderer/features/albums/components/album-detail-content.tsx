import { MutableRefObject, useCallback, useMemo } from 'react';
import { RowDoubleClickedEvent, RowHeightParams, RowNode } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Group, Stack } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { FaLastfmSquare } from 'react-icons/fa';
import { RiHeartFill, RiHeartLine, RiMoreFill, RiSettings2Fill } from 'react-icons/ri';
import { SiMusicbrainz } from 'react-icons/si';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListSort, LibraryItem, QueueSong, SortOrder } from '/@/renderer/api/types';
import { Button, Popover, Spoiler } from '/@/renderer/components';
import { MemoizedSwiperGridCarousel } from '/@/renderer/components/grid-carousel';
import {
    TableConfigDropdown,
    VirtualTable,
    getColumnDefs,
} from '/@/renderer/components/virtual-table';
import { FullWidthDiscCell } from '/@/renderer/components/virtual-table/cells/full-width-disc-cell';
import { useCurrentSongRowStyles } from '/@/renderer/components/virtual-table/hooks/use-current-song-row-styles';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import {
    useHandleGeneralContextMenu,
    useHandleTableContextMenu,
} from '/@/renderer/features/context-menu';
import {
    ALBUM_CONTEXT_MENU_ITEMS,
    SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { PlayButton, useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { LibraryBackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { useAppFocus, useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useCurrentSong, useCurrentStatus } from '/@/renderer/store';
import {
    useGeneralSettings,
    usePlayButtonBehavior,
    useSettingsStoreActions,
    useTableSettings,
} from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';

const isFullWidthRow = (node: RowNode) => {
    return node.id?.startsWith('disc-');
};

const ContentContainer = styled.div`
    position: relative;
    z-index: 0;
`;

const DetailContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem 2rem 5rem;
    overflow: hidden;
`;

interface AlbumDetailContentProps {
    background?: string;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumDetailContent = ({ tableRef, background }: AlbumDetailContentProps) => {
    const { t } = useTranslation();
    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useAlbumDetail({ query: { id: albumId }, serverId: server?.id });
    const cq = useContainerQuery();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const tableConfig = useTableSettings('albumDetail');
    const { setTable } = useSettingsStoreActions();
    const status = useCurrentStatus();
    const isFocused = useAppFocus();
    const currentSong = useCurrentSong();
    const { externalLinks } = useGeneralSettings();
    const genreRoute = useGenreRoute();

    const columnDefs = useMemo(
        () => getColumnDefs(tableConfig.columns, false, 'albumDetail'),
        [tableConfig.columns],
    );

    const getRowHeight = useCallback(
        (params: RowHeightParams) => {
            if (isFullWidthRow(params.node)) {
                return 45;
            }

            return tableConfig.rowHeight;
        },
        [tableConfig.rowHeight],
    );

    const songsRowData = useMemo(() => {
        if (!detailQuery.data?.songs) {
            return [];
        }

        let discNumber = -1;
        let discSubtitle: string | null = null;

        const rowData: (QueueSong | { id: string; name: string })[] = [];
        const discTranslated = t('common.disc', { postProcess: 'upperCase' });

        for (const song of detailQuery.data.songs) {
            if (song.discNumber !== discNumber || song.discSubtitle !== discSubtitle) {
                discNumber = song.discNumber;
                discSubtitle = song.discSubtitle;

                let id = `disc-${discNumber}`;
                let name = `${discTranslated} ${discNumber}`;

                if (discSubtitle) {
                    id += `-${discSubtitle}`;
                    name += `: ${discSubtitle}`;
                }

                rowData.push({ id, name });
            }
            rowData.push(song);
        }

        return rowData;
    }, [detailQuery.data?.songs, t]);

    const [pagination, setPagination] = useSetState({
        artist: 0,
    });

    const handleNextPage = useCallback(
        (key: 'artist') => {
            setPagination({
                [key]: pagination[key as keyof typeof pagination] + 1,
            });
        },
        [pagination, setPagination],
    );

    const handlePreviousPage = useCallback(
        (key: 'artist') => {
            setPagination({
                [key]: pagination[key as keyof typeof pagination] - 1,
            });
        },
        [pagination, setPagination],
    );

    const artistQuery = useAlbumList({
        options: {
            cacheTime: 1000 * 60,
            enabled: detailQuery?.data?.albumArtists[0]?.id !== undefined,
            keepPreviousData: true,
            staleTime: 1000 * 60,
        },
        query: {
            _custom: {
                jellyfin: {
                    AlbumArtistIds: detailQuery?.data?.albumArtists[0]?.id,
                    ExcludeItemIds: detailQuery?.data?.id,
                },
                navidrome: {
                    artist_id: detailQuery?.data?.albumArtists[0]?.id,
                },
            },
            limit: 15,
            sortBy: AlbumListSort.YEAR,
            sortOrder: SortOrder.DESC,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const relatedAlbumGenresRequest = {
        _custom: {
            jellyfin: {
                GenreIds: detailQuery?.data?.genres?.[0]?.id,
            },
            navidrome: {
                genre_id: detailQuery?.data?.genres?.[0]?.id,
            },
        },
        limit: 15,
        sortBy: AlbumListSort.RANDOM,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
    };

    const relatedAlbumGenresQuery = useAlbumList({
        options: {
            cacheTime: 1000 * 60,
            enabled: !!detailQuery?.data?.genres?.[0],
            queryKey: queryKeys.albums.related(
                server?.id || '',
                albumId,
                relatedAlbumGenresRequest,
            ),
            staleTime: 1000 * 60,
        },
        query: relatedAlbumGenresRequest,
        serverId: server?.id,
    });

    const carousels = [
        {
            data: artistQuery?.data?.items.filter((a) => a.id !== detailQuery?.data?.id),
            isHidden: !artistQuery?.data?.items.filter((a) => a.id !== detailQuery?.data?.id)
                .length,
            loading: artistQuery?.isLoading || artistQuery.isFetching,
            pagination: {
                handleNextPage: () => handleNextPage('artist'),
                handlePreviousPage: () => handlePreviousPage('artist'),
                hasPreviousPage: pagination.artist > 0,
            },
            title: t('page.albumDetail.moreFromArtist', { postProcess: 'sentenceCase' }),
            uniqueId: 'mostPlayed',
        },
        {
            data: relatedAlbumGenresQuery?.data?.items.filter(
                (a) => a.id !== detailQuery?.data?.id,
            ),
            isHidden: !relatedAlbumGenresQuery?.data?.items.filter(
                (a) => a.id !== detailQuery?.data?.id,
            ).length,
            loading: relatedAlbumGenresQuery?.isLoading || relatedAlbumGenresQuery.isFetching,
            title: t('page.albumDetail.moreFromGeneric', {
                item: detailQuery?.data?.genres?.[0]?.name,
                postProcess: 'sentenceCase',
            }),
            uniqueId: 'relatedGenres',
        },
    ];
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType?: Play) => {
        handlePlayQueueAdd?.({
            byData: detailQuery?.data?.songs,
            playType: playType || playButtonBehavior,
        });
    };

    const onCellContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data || e.node.isFullWidthCell()) return;

        const rowData: QueueSong[] = [];
        e.api.forEachNode((node) => {
            if (!node.data || node.isFullWidthCell()) return;
            rowData.push(node.data);
        });

        handlePlayQueueAdd?.({
            byData: rowData,
            initialSongId: e.data.id,
            playType: playButtonBehavior,
        });
    };

    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});

    const handleFavorite = () => {
        if (!detailQuery?.data) return;

        if (detailQuery.data.userFavorite) {
            deleteFavoriteMutation.mutate({
                query: {
                    id: [detailQuery.data.id],
                    type: LibraryItem.ALBUM,
                },
                serverId: detailQuery.data.serverId,
            });
        } else {
            createFavoriteMutation.mutate({
                query: {
                    id: [detailQuery.data.id],
                    type: LibraryItem.ALBUM,
                },
                serverId: detailQuery.data.serverId,
            });
        }
    };

    const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;
    const comment = detailQuery?.data?.comment;

    const handleGeneralContextMenu = useHandleGeneralContextMenu(
        LibraryItem.ALBUM,
        ALBUM_CONTEXT_MENU_ITEMS,
    );

    const onColumnMoved = useCallback(() => {
        const { columnApi } = tableRef?.current || {};
        const columnsOrder = columnApi?.getAllGridColumns();

        if (!columnsOrder) return;

        const columnsInSettings = tableConfig.columns;
        const updatedColumns = [];
        for (const column of columnsOrder) {
            const columnInSettings = columnsInSettings.find(
                (c) => c.column === column.getColDef().colId,
            );

            if (columnInSettings) {
                updatedColumns.push({
                    ...columnInSettings,
                    ...(!tableConfig.autoFit && {
                        width: column.getActualWidth(),
                    }),
                });
            }
        }

        setTable('albumDetail', { ...tableConfig, columns: updatedColumns });
    }, [setTable, tableConfig, tableRef]);

    const { rowClassRules } = useCurrentSongRowStyles({ tableRef });

    const mbzId = detailQuery?.data?.mbzId;

    return (
        <ContentContainer>
            <LibraryBackgroundOverlay $backgroundColor={background} />
            <DetailContainer>
                <Box component="section">
                    <Group
                        position="apart"
                        spacing="sm"
                    >
                        <Group>
                            <PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                            <Button
                                compact
                                loading={
                                    createFavoriteMutation.isLoading ||
                                    deleteFavoriteMutation.isLoading
                                }
                                variant="subtle"
                                onClick={handleFavorite}
                            >
                                {detailQuery?.data?.userFavorite ? (
                                    <RiHeartFill
                                        color="red"
                                        size={20}
                                    />
                                ) : (
                                    <RiHeartLine size={20} />
                                )}
                            </Button>
                            <Button
                                compact
                                variant="subtle"
                                onClick={(e) => {
                                    if (!detailQuery?.data) return;
                                    handleGeneralContextMenu(e, [detailQuery.data!]);
                                }}
                            >
                                <RiMoreFill size={20} />
                            </Button>
                        </Group>

                        <Popover position="bottom-end">
                            <Popover.Target>
                                <Button
                                    compact
                                    size="md"
                                    variant="subtle"
                                >
                                    <RiSettings2Fill size={20} />
                                </Button>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <TableConfigDropdown type="albumDetail" />
                            </Popover.Dropdown>
                        </Popover>
                    </Group>
                </Box>
                {showGenres && (
                    <Box component="section">
                        <Group spacing="sm">
                            {detailQuery?.data?.genres?.map((genre) => (
                                <Button
                                    key={`genre-${genre.id}`}
                                    compact
                                    component={Link}
                                    radius={0}
                                    size="md"
                                    to={generatePath(genreRoute, {
                                        genreId: genre.id,
                                    })}
                                    variant="outline"
                                >
                                    {genre.name}
                                </Button>
                            ))}
                        </Group>
                    </Box>
                )}
                {externalLinks ? (
                    <Box component="section">
                        <Group spacing="sm">
                            <Button
                                compact
                                component="a"
                                href={`https://www.last.fm/music/${encodeURIComponent(
                                    detailQuery?.data?.albumArtist || '',
                                )}/${encodeURIComponent(detailQuery.data?.name || '')}`}
                                radius="md"
                                rel="noopener noreferrer"
                                size="md"
                                target="_blank"
                                tooltip={{
                                    label: t('action.openIn.lastfm'),
                                }}
                                variant="subtle"
                            >
                                <FaLastfmSquare size={25} />
                            </Button>
                            {mbzId ? (
                                <Button
                                    compact
                                    component="a"
                                    href={`https://musicbrainz.org/release/${mbzId}`}
                                    radius="md"
                                    rel="noopener noreferrer"
                                    size="md"
                                    target="_blank"
                                    tooltip={{
                                        label: t('action.openIn.musicbrainz'),
                                    }}
                                    variant="subtle"
                                >
                                    <SiMusicbrainz size={25} />
                                </Button>
                            ) : null}
                        </Group>
                    </Box>
                ) : null}
                {comment && (
                    <Box component="section">
                        <Spoiler maxHeight={75}>{replaceURLWithHTMLLinks(comment)}</Spoiler>
                    </Box>
                )}
                <Box style={{ minHeight: '300px' }}>
                    <VirtualTable
                        key={`table-${tableConfig.rowHeight}`}
                        ref={tableRef}
                        autoHeight
                        shouldUpdateSong
                        stickyHeader
                        suppressCellFocus
                        suppressLoadingOverlay
                        suppressRowDrag
                        autoFitColumns={tableConfig.autoFit}
                        columnDefs={columnDefs}
                        context={{
                            currentSong,
                            isFocused,
                            onCellContextMenu,
                            status,
                        }}
                        enableCellChangeFlash={false}
                        fullWidthCellRenderer={FullWidthDiscCell}
                        getRowHeight={getRowHeight}
                        getRowId={(data) => data.data.id}
                        isFullWidthRow={(data) => {
                            return isFullWidthRow(data.rowNode) || false;
                        }}
                        isRowSelectable={(data) => {
                            if (isFullWidthRow(data.data)) return false;
                            return true;
                        }}
                        rowClassRules={rowClassRules}
                        rowData={songsRowData}
                        rowSelection="multiple"
                        onCellContextMenu={onCellContextMenu}
                        onColumnMoved={onColumnMoved}
                        onRowDoubleClicked={handleRowDoubleClick}
                    />
                </Box>
                <Stack
                    ref={cq.ref}
                    mt="3rem"
                    spacing="lg"
                >
                    {cq.height || cq.width ? (
                        <>
                            {carousels
                                .filter((c) => !c.isHidden)
                                .map((carousel, index) => (
                                    <MemoizedSwiperGridCarousel
                                        key={`carousel-${carousel.uniqueId}-${index}`}
                                        cardRows={[
                                            {
                                                property: 'name',
                                                route: {
                                                    route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                                    slugs: [
                                                        {
                                                            idProperty: 'id',
                                                            slugProperty: 'albumId',
                                                        },
                                                    ],
                                                },
                                            },
                                            {
                                                arrayProperty: 'name',
                                                property: 'albumArtists',
                                                route: {
                                                    route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                                                    slugs: [
                                                        {
                                                            idProperty: 'id',
                                                            slugProperty: 'albumArtistId',
                                                        },
                                                    ],
                                                },
                                            },
                                        ]}
                                        data={carousel.data}
                                        isLoading={carousel.loading}
                                        itemType={LibraryItem.ALBUM}
                                        route={{
                                            route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                            slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                                        }}
                                        title={{
                                            label: carousel.title,
                                        }}
                                        uniqueId={carousel.uniqueId}
                                    />
                                ))}
                        </>
                    ) : null}
                </Stack>
            </DetailContainer>
        </ContentContainer>
    );
};
