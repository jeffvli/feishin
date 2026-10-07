import clsx from 'clsx';
import { motion } from 'motion/react';
import {
    type ComponentType,
    type CSSProperties,
    forwardRef,
    ImgHTMLAttributes,
    memo,
    useMemo,
} from 'react';
import { IconBaseProps } from 'react-icons';
import { CgSpinnerTwoAlt } from 'react-icons/cg';
import {
    LuAlignCenter,
    LuAlignLeft,
    LuAlignRight,
    LuAppWindow,
    LuArrowDown,
    LuArrowDownToLine,
    LuArrowDownWideNarrow,
    LuArrowLeft,
    LuArrowLeftRight,
    LuArrowLeftToLine,
    LuArrowRight,
    LuArrowRightToLine,
    LuArrowUp,
    LuArrowUpDown,
    LuArrowUpNarrowWide,
    LuArrowUpToLine,
    LuAudioLines,
    LuBell,
    LuBookOpen,
    LuBraces,
    LuCalendar,
    LuCamera,
    LuCast,
    LuCheck,
    LuChevronDown,
    LuChevronLast,
    LuChevronLeft,
    LuChevronRight,
    LuChevronUp,
    LuChevronsDownUp,
    LuChevronsUpDown,
    LuCircle,
    LuCircleCheck,
    LuCircleSlash,
    LuCircleX,
    LuCitrus,
    LuClipboardCopy,
    LuClock3,
    LuCloudDownload,
    LuCommand,
    LuCornerDownRight,
    LuCornerUpRight,
    LuCrown,
    LuDices,
    LuDisc,
    LuDisc3,
    LuDownload,
    LuEllipsis,
    LuEllipsisVertical,
    LuExpand,
    LuExternalLink,
    LuEye,
    LuFileJson,
    LuFlag,
    LuFlame,
    LuFolderClosed,
    LuFolderOpen,
    LuGauge,
    LuGift,
    LuGithub,
    LuGrid3X3,
    LuGripHorizontal,
    LuGripVertical,
    LuGroup,
    LuHardDrive,
    LuHash,
    LuHeadphones,
    LuHeart,
    LuHeartCrack,
    LuHeartHandshake,
    LuHistory,
    LuHourglass,
    LuImage,
    LuInfinity,
    LuInfo,
    LuKeyboard,
    LuLanguages,
    LuLayoutGrid,
    LuLayoutList,
    LuLibrary,
    LuLibraryBig,
    LuLightbulb,
    LuList,
    LuListFilter,
    LuListMinus,
    LuListMusic,
    LuListPlus,
    LuLock,
    LuLockOpen,
    LuLogIn,
    LuLogOut,
    LuMenu,
    LuMessageCircle,
    LuMicVocal,
    LuMinus,
    LuMonitorPlay,
    LuMoon,
    LuMusic,
    LuMusic2,
    LuPackage2,
    LuPalette,
    LuPanelBottom,
    LuPanelRight,
    LuPanelRightClose,
    LuPanelRightOpen,
    LuPartyPopper,
    LuPause,
    LuPencilLine,
    LuPin,
    LuPinOff,
    LuPlay,
    LuPlus,
    LuRadio,
    LuRocket,
    LuRotateCw,
    LuSave,
    LuSearch,
    LuSettings,
    LuSettings2,
    LuShare2,
    LuShieldAlert,
    LuShrink,
    LuShuffle,
    LuSkipBack,
    LuSkipForward,
    LuSlidersHorizontal,
    LuSmile,
    LuSparkle,
    LuSparkles,
    LuSquare,
    LuSquareCheck,
    LuSquareMenu,
    LuStar,
    LuStepBack,
    LuStepForward,
    LuStickyNote,
    LuSun,
    LuSwords,
    LuTable,
    LuTimer,
    LuTimerOff,
    LuTrash,
    LuTriangleAlert,
    LuTrophy,
    LuUndo2,
    LuUpload,
    LuUser,
    LuUserPen,
    LuUserRoundCog,
    LuUsers,
    LuVolume1,
    LuVolume2,
    LuVolumeX,
    LuWand,
    LuWaves,
    LuWifi,
    LuWifiOff,
    LuWrench,
    LuX,
} from 'react-icons/lu';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';
import { PiMouseLeftClickFill, PiMouseRightClickFill } from 'react-icons/pi';
import { RiPlayListAddLine, RiRepeat2Line, RiRepeatOneLine } from 'react-icons/ri';

import styles from './icon.module.css';
import lastfmLogoIcon from './lastfm_logo_icon.png';
import listenbrainzLogoIcon from './listenbrainz_logo_icon.svg';
import musicbrainzLogoIcon from './musicbrainz_logo_icon.svg';
import qobuzLogoIcon from './qobuz_logo_icon.png';
import spotifyLogoIcon from './spotify_logo_icon.svg';

export type AppIconSelection = keyof typeof AppIcon;

type LogoImgProps = ImgHTMLAttributes<HTMLImageElement> & { size?: number | string };

function logoImgStyle(size: number | string | undefined): CSSProperties | undefined {
    if (size === undefined) return undefined;
    const dim = typeof size === 'number' ? `${size}px` : size;
    return { height: dim, width: dim };
}

const ListenBrainzLogoIcon = forwardRef<HTMLImageElement, LogoImgProps>(
    ({ className, size, style, ...props }, ref) => (
        <img
            alt="ListenBrainz"
            className={className}
            ref={ref}
            src={listenbrainzLogoIcon}
            style={logoImgStyle(size) ?? style}
            {...props}
        />
    ),
);

const SpotifyLogoIcon = forwardRef<HTMLImageElement, LogoImgProps>(
    ({ className, size, style, ...props }, ref) => (
        <img
            alt="Spotify"
            className={className}
            ref={ref}
            src={spotifyLogoIcon}
            style={logoImgStyle(size) ?? style}
            {...props}
        />
    ),
);

const MusicBrainzLogoIcon = forwardRef<HTMLImageElement, LogoImgProps>(
    ({ className, size, style, ...props }, ref) => (
        <img
            alt="MusicBrainz"
            className={className}
            ref={ref}
            src={musicbrainzLogoIcon}
            style={logoImgStyle(size) ?? style}
            {...props}
        />
    ),
);

const QobuzLogoIcon = forwardRef<HTMLImageElement, LogoImgProps>(
    ({ className, size, style, ...props }, ref) => (
        <img
            alt="Qobuz"
            className={className}
            ref={ref}
            src={qobuzLogoIcon}
            style={logoImgStyle(size) ?? style}
            {...props}
        />
    ),
);

const LastfmLogoIcon = forwardRef<HTMLImageElement, LogoImgProps>(
    ({ className, size, style, ...props }, ref) => (
        <img
            alt="Last.fm"
            className={className}
            ref={ref}
            src={lastfmLogoIcon}
            style={logoImgStyle(size) ?? style}
            {...props}
        />
    ),
);

export const AppIcon = {
    add: LuPlus,
    album: LuDisc3,
    alignCenter: LuAlignCenter,
    alignLeft: LuAlignLeft,
    alignRight: LuAlignRight,
    appWindow: LuAppWindow,
    arrowDown: LuArrowDown,
    arrowDownS: LuChevronDown,
    arrowDownToLine: LuArrowDownToLine,
    arrowLeft: LuArrowLeft,
    arrowLeftRight: LuArrowLeftRight,
    arrowLeftS: LuChevronLeft,
    arrowLeftToLine: LuArrowLeftToLine,
    arrowRight: LuArrowRight,
    arrowRightLast: LuChevronLast,
    arrowRightS: LuChevronRight,
    arrowRightToLine: LuArrowRightToLine,
    arrowUp: LuArrowUp,
    arrowUpS: LuChevronUp,
    arrowUpToLine: LuArrowUpToLine,
    artist: LuUserPen,
    audioLines: LuAudioLines,
    brandGitHub: LuGithub,
    brandLastfm: LastfmLogoIcon,
    brandListenBrainz: ListenBrainzLogoIcon,
    brandMusicBrainz: MusicBrainzLogoIcon,
    brandQobuz: QobuzLogoIcon,
    brandSpotify: SpotifyLogoIcon,
    cache: LuCloudDownload,
    cast: LuCast,
    check: LuCheck,
    circle: LuCircle,
    circleSlash: LuCircleSlash,
    clipboardCopy: LuClipboardCopy,
    collapseAll: LuChevronsDownUp,
    collection: LuPackage2,
    delete: LuTrash,
    disc: LuDisc,
    download: LuDownload,
    dragHorizontal: LuGripHorizontal,
    dragVertical: LuGripVertical,
    dropdown: LuChevronDown,
    duration: LuClock3,
    edit: LuPencilLine,
    ellipsisHorizontal: LuEllipsis,
    ellipsisVertical: LuEllipsisVertical,
    emptyAlbumImage: LuDisc3,
    emptyArtistImage: LuUser,
    emptyGenreImage: LuFlag,
    emptyImage: LuDisc3,
    emptyPlaylistImage: LuListMusic,
    emptySongImage: LuMusic,
    error: LuShieldAlert,
    expand: LuExpand,
    expandAll: LuChevronsUpDown,
    externalLink: LuExternalLink,
    favorite: LuHeart,
    fileJson: LuFileJson,
    filter: LuListFilter,
    folder: LuFolderOpen,
    folderClosed: LuFolderClosed,
    genre: LuFlag,
    goToItem: LuCornerDownRight,
    group: LuGroup,
    groupPlay: LuUsers,
    hash: LuHash,
    home: LuSquareMenu,
    image: LuImage,
    info: LuInfo,
    itemAlbum: LuDisc3,
    itemSong: LuMusic,
    json: LuBraces,
    keyboard: LuKeyboard,
    languages: LuLanguages,
    lastPlayed: LuHeadphones,
    layoutDetail: LuLayoutList,
    layoutGrid: LuLayoutGrid,
    layoutList: LuList,
    layoutPanelBottom: LuPanelBottom,
    layoutPanelRight: LuPanelRight,
    layoutTable: LuTable,
    library: LuLibrary,
    list: LuList,
    listInfinite: LuInfinity,
    listPaginated: LuArrowRightToLine,
    lock: LuLock,
    lockOpen: LuLockOpen,
    mediaNext: LuSkipForward,
    mediaPause: LuPause,
    mediaPlay: LuPlay,
    mediaPlayLast: LuChevronLast,
    mediaPlayNext: LuCornerUpRight,
    mediaPrevious: LuSkipBack,
    mediaRandom: RiPlayListAddLine,
    mediaRepeat: RiRepeat2Line,
    mediaRepeatOne: RiRepeatOneLine,
    mediaSettings: LuSlidersHorizontal,
    mediaShuffle: LuShuffle,
    mediaSpeed: LuGauge,
    mediaStepBackward: LuStepBack,
    mediaStepForward: LuStepForward,
    mediaStop: LuSquare,
    menu: LuMenu,
    metadata: LuBookOpen,
    microphone: LuMicVocal,
    minus: LuMinus,
    mouseLeftClick: PiMouseLeftClickFill,
    mouseRightClick: PiMouseRightClickFill,
    musicVideo: LuMonitorPlay,
    panelRightClose: LuPanelRightClose,
    panelRightOpen: LuPanelRightOpen,
    pin: LuPin,
    playlist: LuListMusic,
    playlistAdd: LuListPlus,
    playlistDelete: LuListMinus,
    plus: LuPlus,
    queryBuilder: LuWrench,
    queue: LuList,
    radio: LuRadio,
    refresh: LuRotateCw,
    related: LuSparkle,
    remove: LuMinus,
    save: LuSave,
    search: LuSearch,
    server: LuHardDrive,
    settings: LuSettings2,
    settings2: LuSettings,
    share: LuShare2,
    palette: LuPalette,
    sparkles: LuSparkles,
    gift: LuGift,
    partyPopper: LuPartyPopper,
    trophy: LuTrophy,
    swords: LuSwords,
    hourglass: LuHourglass,
    stickyNote: LuStickyNote,
    crown: LuCrown,
    dices: LuDices,
    waves: LuWaves,
    command: LuCommand,
    messageCircle: LuMessageCircle,
    smile: LuSmile,
    flame: LuFlame,
    history: LuHistory,
    citrus: LuCitrus,
    wand: LuWand,
    heartHandshake: LuHeartHandshake,
    calendar: LuCalendar,
    bell: LuBell,
    lightbulb: LuLightbulb,
    eye: LuEye,
    grid: LuGrid3X3,
    library2: LuLibraryBig,
    wrench: LuWrench,
    rocket: LuRocket,
    shrink: LuShrink,
    signIn: LuLogIn,
    signOut: LuLogOut,
    sleepTimer: LuTimer,
    sleepTimerOff: LuTimerOff,
    sort: LuArrowUpDown,
    sortAsc: LuArrowUpNarrowWide,
    sortDesc: LuArrowDownWideNarrow,
    spinner: CgSpinnerTwoAlt,
    square: LuSquare,
    squareCheck: LuSquareCheck,
    star: LuStar,
    success: LuCircleCheck,
    themeDark: LuMoon,
    themeLight: LuSun,
    track: LuMusic2,
    undo: LuUndo2,
    unfavorite: LuHeartCrack,
    unpin: LuPinOff,
    upload: LuUpload,
    uploadImage: LuCamera,
    user: LuUser,
    userManage: LuUserRoundCog,
    visibility: MdOutlineVisibility,
    visibilityOff: MdOutlineVisibilityOff,
    volumeMax: LuVolume2,
    volumeMute: LuVolumeX,
    volumeNormal: LuVolume1,
    warn: LuTriangleAlert,
    wifiOff: LuWifiOff,
    wifiOn: LuWifi,
    x: LuX,
    xCircle: LuCircleX,
} as const;

export type IconColor =
    | 'contrast'
    | 'default'
    | 'error'
    | 'favorite'
    | 'info'
    | 'inherit'
    | 'muted'
    | 'primary'
    | 'success'
    | 'transparent'
    | 'warn';

export interface IconProps extends Omit<IconBaseProps, 'color' | 'fill' | 'size'> {
    animate?: 'pulse' | 'spin';
    color?: IconColor;
    fill?: IconColor;
    icon: keyof typeof AppIcon;
    size?: '2xl' | '3xl' | '4xl' | '5xl' | 'lg' | 'md' | 'sm' | 'xl' | 'xs' | number | string;
}

const _Icon = forwardRef<HTMLDivElement, IconProps>((props, ref) => {
    const { animate, className, color, fill, icon, size = 'md' } = props;

    const IconComponent: ComponentType<any> = AppIcon[icon];

    const colorClassToken = color ?? (fill && fill !== 'transparent' ? fill : undefined);

    const classNames = useMemo(
        () =>
            clsx(className, {
                [styles.fill]: true,
                [styles.pulse]: animate === 'pulse',
                [styles.spin]: animate === 'spin',
                [styles[`color-${colorClassToken}`]]: colorClassToken,
                [styles[`fill-${fill}`]]: fill,
                [styles[`size-${size}`]]: true,
            }),
        [animate, className, colorClassToken, fill, size],
    );

    return (
        <IconComponent
            className={classNames}
            fill={fill}
            ref={ref}
            size={isPredefinedSize(size) ? undefined : size}
        />
    );
});

_Icon.displayName = 'Icon';

export const Icon = memo(_Icon);

Icon.displayName = 'Icon';

export const MotionIcon: ComponentType = motion.create(Icon);

function isPredefinedSize(size: IconProps['size']) {
    return (
        size === '2xl' ||
        size === '3xl' ||
        size === '4xl' ||
        size === '5xl' ||
        size === 'lg' ||
        size === 'md' ||
        size === 'sm' ||
        size === 'xl' ||
        size === 'xs'
    );
}
