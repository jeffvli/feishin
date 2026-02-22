import React, { type ReactNode } from 'react';

import type { ItemDetailListCellProps } from './types';

import { ActionsColumn } from './actions-column';
import { AlbumArtistColumn } from './album-artist-column';
import { AlbumColumn } from './album-column';
import { ArtistColumn } from './artist-column';
import { BitDepthColumn } from './bit-depth-column';
import { BitRateColumn } from './bit-rate-column';
import { BpmColumn } from './bpm-column';
import { ChannelsColumn } from './channels-column';
import { CodecColumn } from './codec-column';
import { CommentColumn } from './comment-column';
import { ComposerColumn } from './composer-column';
import { DateAddedColumn } from './date-added-column';
import { DefaultColumn } from './default-column';
import { DiscNumberColumn } from './disc-number-column';
import { DurationColumn } from './duration-column';
import { FavoriteColumn } from './favorite-column';
import { GenreBadgeColumn } from './genre-badge-column';
import { GenreColumn } from './genre-column';
import { ImageColumn } from './image-column';
import { LastPlayedColumn } from './last-played-column';
import { PathColumn } from './path-column';
import { PlayCountColumn } from './play-count-column';
import { RatingColumn } from './rating-column';
import { ReleaseDateColumn } from './release-date-column';
import { RowIndexColumn } from './row-index-column';
import { SampleRateColumn } from './sample-rate-column';
import { SizeColumn } from './size-column';
import { TitleArtistColumn } from './title-artist-column';
import { TitleColumn } from './title-column';
import { TitleCombinedColumn } from './title-combined-column';
import { TrackNumberColumn } from './track-number-column';
import { YearColumn } from './year-column';

import { TableColumn } from '/@/shared/types/types';

type CellComponent = (props: ItemDetailListCellProps) => ReactNode;

const COLUMN_MAP: Partial<Record<TableColumn, CellComponent>> = {
    [TableColumn.ACTIONS]: ActionsColumn,
    [TableColumn.ALBUM]: AlbumColumn,
    [TableColumn.ALBUM_ARTIST]: AlbumArtistColumn,
    [TableColumn.ARTIST]: ArtistColumn,
    [TableColumn.BIT_DEPTH]: BitDepthColumn,
    [TableColumn.BIT_RATE]: BitRateColumn,
    [TableColumn.BPM]: BpmColumn,
    [TableColumn.CHANNELS]: ChannelsColumn,
    [TableColumn.CODEC]: CodecColumn,
    [TableColumn.COMMENT]: CommentColumn,
    [TableColumn.COMPOSER]: ComposerColumn,
    [TableColumn.DATE_ADDED]: DateAddedColumn,
    [TableColumn.DISC_NUMBER]: DiscNumberColumn,
    [TableColumn.DURATION]: DurationColumn,
    [TableColumn.GENRE]: GenreColumn,
    [TableColumn.GENRE_BADGE]: GenreBadgeColumn,
    [TableColumn.IMAGE]: ImageColumn,
    [TableColumn.LAST_PLAYED]: LastPlayedColumn,
    [TableColumn.PATH]: PathColumn,
    [TableColumn.PLAY_COUNT]: PlayCountColumn,
    [TableColumn.RELEASE_DATE]: ReleaseDateColumn,
    [TableColumn.ROW_INDEX]: RowIndexColumn,
    [TableColumn.SAMPLE_RATE]: SampleRateColumn,
    [TableColumn.SIZE]: SizeColumn,
    [TableColumn.TITLE]: TitleColumn,
    [TableColumn.TITLE_ARTIST]: TitleArtistColumn,
    [TableColumn.TITLE_COMBINED]: TitleCombinedColumn,
    [TableColumn.TRACK_NUMBER]: TrackNumberColumn,
    [TableColumn.USER_FAVORITE]: FavoriteColumn,
    [TableColumn.USER_RATING]: RatingColumn,
    [TableColumn.YEAR]: YearColumn,
};

export type DetailListCellComponentProps = ItemDetailListCellProps & { columnId?: string };

export function getDetailListCellComponent(
    columnId: string | TableColumn,
): (props: DetailListCellComponentProps) => ReactNode {
    const Component = COLUMN_MAP[columnId as TableColumn];
    if (Component) {
        return Component as (props: DetailListCellComponentProps) => ReactNode;
    }
    return (props: DetailListCellComponentProps) =>
        React.createElement(DefaultColumn, {
            columnId: props.columnId ?? (columnId as string),
            song: props.song,
        });
}

export type { ItemDetailListCellProps } from './types';

export {
    ActionsColumn,
    AlbumArtistColumn,
    AlbumColumn,
    ArtistColumn,
    BitDepthColumn,
    BitRateColumn,
    BpmColumn,
    ChannelsColumn,
    CodecColumn,
    CommentColumn,
    ComposerColumn,
    DateAddedColumn,
    DefaultColumn,
    DiscNumberColumn,
    DurationColumn,
    FavoriteColumn,
    GenreBadgeColumn,
    GenreColumn,
    ImageColumn,
    LastPlayedColumn,
    PathColumn,
    PlayCountColumn,
    RatingColumn,
    ReleaseDateColumn,
    RowIndexColumn,
    SampleRateColumn,
    SizeColumn,
    TitleArtistColumn,
    TitleColumn,
    TitleCombinedColumn,
    TrackNumberColumn,
    YearColumn,
};
