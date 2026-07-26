import clsx from 'clsx';

import styles from './stacked-covers.module.css';

import { api } from '/@/renderer/api';
import { useCurrentServerId } from '/@/renderer/store';
import {
    ArtistCoverStackDisplayFit,
    type ArtistCoverStackDisplayFitType,
    ArtistCoverStackStyle,
    type ArtistCoverStackStyleType,
} from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/shared/types/domain-types';

interface AlbumCoverData {
    albumId: string;
    imageUrl: string;
}

interface StackThemeConfig {
    albums: AlbumCoverData[];
    className?: string;
    fitment: ArtistCoverStackDisplayFitType;
    isRound?: boolean;
    maxStackSize: number;
    overfitSize: number;
    spunRotation?: number;
    staggerHeight?: number;
    staggerWidth?: number;
}

// Base class for stack themes - provides common structure and scaling calculations
abstract class StackTheme {
    protected albums: AlbumCoverData[];
    protected className?: string;
    protected fitment: ArtistCoverStackDisplayFitType;
    protected isRound: boolean;
    protected maxStackSize: number;
    protected overfitSize: number;

    constructor(config: StackThemeConfig) {
        this.albums = config.albums;
        this.className = config.className;
        this.fitment = config.fitment;
        this.isRound = config.isRound ?? false;
        this.maxStackSize = config.maxStackSize;
        this.overfitSize = config.overfitSize;
    }

    // Render the stack - implemented by subclasses
    abstract render(): React.ReactNode;

    // Calculate the scale factor needed to fit the stack within a container
    // Returns a value between 0 and 1 (or greater for overfit)
    protected abstract calculateScaleFactor(): number;

    // Get the effective stack size based on fitment mode
    protected getEffectiveStackSize(): number {
        switch (this.fitment) {
            case ArtistCoverStackDisplayFit.FIT:
            case ArtistCoverStackDisplayFit.OVERFIT:
                // Use actual album count
                return this.albums.length;
            case ArtistCoverStackDisplayFit.UNDERFIT:
            default:
                // Use max stack size for consistent sizing across all stacks
                return this.maxStackSize;
        }
    }
}

// Spun style - albums fanned out with rotation from a center pivot point
class SpunStackTheme extends StackTheme {
    private rotation: number;

    constructor(config: StackThemeConfig) {
        super(config);
        this.rotation = config.spunRotation ?? 6;
    }

    render(): React.ReactNode {
        // Render albums in reverse order so oldest is in DOM first (appears at back due to z-index)
        const reversedAlbums = [...this.albums].reverse();

        // Calculate rotation for each album (oldest has most rotation, newest has 0)
        const getRotation = (index: number) => {
            const rotationsFromNewest = this.albums.length - 1 - index;
            return rotationsFromNewest * this.rotation;
        };

        // Determine scale based on fitment mode
        let scaledSize: number;
        switch (this.fitment) {
            case ArtistCoverStackDisplayFit.FIT:
            case ArtistCoverStackDisplayFit.UNDERFIT:
                scaledSize = 85 * this.calculateScaleFactor();
                break;
            case ArtistCoverStackDisplayFit.OVERFIT:
                scaledSize = this.overfitSize; // Use user-configured size
                break;
        }

        return (
            <div className={clsx(styles['stacked-container'], this.className)}>
                {reversedAlbums.map((album, index) => {
                    const rotation = getRotation(index);
                    const zIndex = index;

                    return (
                        <div
                            className={clsx(styles['album-cover'], styles['spun-cover'], {
                                [styles['is-round']]: this.isRound,
                            })}
                            key={`${album.albumId}-${index}`}
                            style={{
                                height: `${scaledSize}%`,
                                transform: `rotate(-${rotation}deg)`,
                                width: `${scaledSize}%`,
                                zIndex,
                            }}
                        >
                            <img
                                alt=""
                                className={clsx(styles['album-image'], {
                                    [styles['is-round']]: this.isRound,
                                })}
                                loading="lazy"
                                src={album.imageUrl}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    // For a rotated square, the bounding box dimensions can be calculated
    // When a square of side 's' is rotated by angle θ, the bounding box becomes:
    // width = s * (|cos(θ)| + |sin(θ)|)
    // height = s * (|cos(θ)| + |sin(θ)|)
    // For a stack with multiple albums, the total rotation is (n-1) * rotation
    protected calculateScaleFactor(): number {
        const effectiveStackSize = this.getEffectiveStackSize();
        if (effectiveStackSize <= 1) return 1;

        // Total rotation angle for the back-most album
        const totalRotationDeg = (effectiveStackSize - 1) * this.rotation;
        const totalRotationRad = (totalRotationDeg * Math.PI) / 180;

        // The bounding box expansion factor for a rotated square
        // For a unit square rotated by θ, the bounding box diagonal expansion is:
        // |cos(θ)| + |sin(θ)|
        const boundingBoxFactor =
            Math.abs(Math.cos(totalRotationRad)) + Math.abs(Math.sin(totalRotationRad));

        // Scale factor to fit within original container
        return 1 / boundingBoxFactor;
    }
}

// Staggered style - albums offset diagonally from top-left to bottom-right
class StaggeredStackTheme extends StackTheme {
    private staggerHeight: number;
    private staggerWidth: number;

    constructor(config: StackThemeConfig) {
        super(config);
        this.staggerWidth = config.staggerWidth ?? 5;
        this.staggerHeight = config.staggerHeight ?? 5;
    }

    render(): React.ReactNode {
        const effectiveStackSize = this.getEffectiveStackSize();

        // Calculate cover size based on fitment mode
        let coverWidth: number;
        let coverHeight: number;

        switch (this.fitment) {
            case ArtistCoverStackDisplayFit.FIT:
            case ArtistCoverStackDisplayFit.UNDERFIT: {
                // Calculate size based on effective stack size (max for underfit, actual for fit)
                const totalStaggerWidth = (effectiveStackSize - 1) * this.staggerWidth;
                const totalStaggerHeight = (effectiveStackSize - 1) * this.staggerHeight;
                coverWidth = 100 - totalStaggerWidth;
                coverHeight = 100 - totalStaggerHeight;
                break;
            }
            case ArtistCoverStackDisplayFit.OVERFIT: {
                // Use user-configured overfit size
                coverWidth = this.overfitSize;
                coverHeight = this.overfitSize;
                break;
            }
        }

        // Reverse so newest album (first in original array) ends up at front (highest z-index)
        const reversedAlbums = [...this.albums].reverse();

        return (
            <div className={clsx(styles['stacked-container'], this.className)}>
                {reversedAlbums.map((album, index) => {
                    const offsetX = index * this.staggerWidth;
                    const offsetY = index * this.staggerHeight;
                    const zIndex = index;

                    return (
                        <div
                            className={clsx(styles['album-cover'], styles['staggered-cover'], {
                                [styles['is-round']]: this.isRound,
                            })}
                            key={`${album.albumId}-${index}`}
                            style={{
                                height: `${coverHeight}%`,
                                left: `${offsetX}%`,
                                top: `${offsetY}%`,
                                width: `${coverWidth}%`,
                                zIndex,
                            }}
                        >
                            <img
                                alt=""
                                className={clsx(styles['album-image'], {
                                    [styles['is-round']]: this.isRound,
                                })}
                                loading="lazy"
                                src={album.imageUrl}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    // For staggered layout, the total space needed is:
    // coverSize + (n-1) * staggerOffset
    // To fit in 100%, coverSize = 100 - (n-1) * staggerOffset
    protected calculateScaleFactor(): number {
        const effectiveStackSize = this.getEffectiveStackSize();
        if (effectiveStackSize <= 1) return 1;

        // Total stagger offset
        const totalStaggerWidth = (effectiveStackSize - 1) * this.staggerWidth;
        const totalStaggerHeight = (effectiveStackSize - 1) * this.staggerHeight;

        // Cover size that fits within container
        const coverWidth = 100 - totalStaggerWidth;
        const coverHeight = 100 - totalStaggerHeight;

        // Return the minimum to ensure both dimensions fit
        return Math.min(coverWidth, coverHeight) / 100;
    }
}

// Factory function to create appropriate theme instance
const createStackTheme = (
    style: ArtistCoverStackStyleType,
    config: StackThemeConfig,
): StackTheme => {
    switch (style) {
        case ArtistCoverStackStyle.SPUN:
            return new SpunStackTheme(config);
        case ArtistCoverStackStyle.STAGGERED:
            return new StaggeredStackTheme(config);
        default:
            return new SpunStackTheme(config);
    }
};

export type ArtistImageDisplay = {
    albumIds?: string[];
    fitment?: ArtistCoverStackDisplayFitType;
    isLoading?: boolean;
    maxStackSize?: number;
    overfitSize?: number;
    showStackedCovers: boolean;
    spunRotation?: number;
    stackStyle?: ArtistCoverStackStyleType;
    staggerHeight?: number;
    staggerWidth?: number;
};

export const getArtistImageDisplay = (
    itemType: LibraryItem,
    settings: {
        artistCoverStackEnabled: boolean;
        artistCoverStackSize: number;
        artistCoverStackSpunRotation: number;
        artistCoverStackStaggerHeight: number;
        artistCoverStackStaggerWidth: number;
        artistCoverStackStyle: ArtistCoverStackStyleType;
        artistCoverStackStyleSettings: Partial<
            Record<
                ArtistCoverStackStyleType,
                { fitment: ArtistCoverStackDisplayFitType; overfitSize: number }
            >
        >;
    },
    stackData: {
        albumIds: null | string[];
        hasRealArtistCover: boolean;
        isLoading: boolean;
    },
): ArtistImageDisplay => {
    // Only apply to artist types
    const isArtistType = itemType === LibraryItem.ALBUM_ARTIST || itemType === LibraryItem.ARTIST;

    // If not an artist or stack feature is disabled, show regular cover
    if (!isArtistType || !settings.artistCoverStackEnabled) {
        return { showStackedCovers: false };
    }

    // Stack feature is enabled - wait for loading to complete before showing anything
    if (stackData.isLoading) {
        return { isLoading: true, showStackedCovers: false };
    }

    // If artist has a real cover, use it instead of stack
    if (stackData.hasRealArtistCover) {
        return { showStackedCovers: false };
    }

    // Check if we have valid album IDs for the stack
    const hasAlbumIds =
        stackData.albumIds && Array.isArray(stackData.albumIds) && stackData.albumIds.length > 0;

    if (hasAlbumIds) {
        const styleSettings =
            settings.artistCoverStackStyleSettings[settings.artistCoverStackStyle];
        return {
            albumIds: stackData.albumIds!,
            fitment: styleSettings?.fitment,
            maxStackSize: settings.artistCoverStackSize,
            overfitSize: styleSettings?.overfitSize,
            showStackedCovers: true,
            spunRotation: settings.artistCoverStackSpunRotation,
            stackStyle: settings.artistCoverStackStyle,
            staggerHeight: settings.artistCoverStackStaggerHeight,
            staggerWidth: settings.artistCoverStackStaggerWidth,
        };
    }

    // No albums with covers found, fall back to regular artist cover
    return { showStackedCovers: false };
};

interface StackedCoversProps {
    albumIds: string[];
    className?: string;
    fitment?: ArtistCoverStackDisplayFitType;
    isRound?: boolean;
    maxStackSize?: number;
    overfitSize?: number;
    spunRotation?: number;
    staggerHeight?: number;
    staggerWidth?: number;
    style?: ArtistCoverStackStyleType;
}

export const StackedCovers = ({
    albumIds,
    className,
    fitment = ArtistCoverStackDisplayFit.FIT,
    isRound,
    maxStackSize = 4,
    overfitSize = 85,
    spunRotation,
    staggerHeight,
    staggerWidth,
    style = ArtistCoverStackStyle.SPUN,
}: StackedCoversProps) => {
    const serverId = useCurrentServerId();

    if (!albumIds || albumIds.length === 0) {
        return null;
    }

    // Build album data with image URLs
    const albums: AlbumCoverData[] = albumIds.map((albumId) => ({
        albumId,
        imageUrl:
            api.controller.getImageUrl({
                apiClientProps: { serverId },
                query: { id: albumId, itemType: LibraryItem.ALBUM, size: 300 },
            }) ?? '',
    }));

    // Create the appropriate theme instance
    const theme = createStackTheme(style, {
        albums,
        className,
        fitment,
        isRound,
        maxStackSize,
        overfitSize,
        spunRotation,
        staggerHeight,
        staggerWidth,
    });

    return theme.render();
};
