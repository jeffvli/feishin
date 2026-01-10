import clsx from 'clsx';
import { motion } from 'motion/react';
import { type ComponentType, forwardRef, memo, useMemo } from 'react';
import { IconBaseProps } from 'react-icons';
import { FaLastfmSquare } from 'react-icons/fa';
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
    LuBookOpen,
    LuCheck,
    LuChevronDown,
    LuChevronLast,
    LuChevronLeft,
    LuChevronRight,
    LuChevronUp,
    LuCircleCheck,
    LuCircleX,
    LuClipboardCopy,
    LuClock3,
    LuCloudDownload,
    LuCornerUpRight,
    LuDelete,
    LuDisc,
    LuDisc3,
    LuDownload,
    LuEllipsis,
    LuEllipsisVertical,
    LuExternalLink,
    LuFileJson,
    LuFlag,
    LuFolderOpen,
    LuGauge,
    LuGithub,
    LuGripHorizontal,
    LuGripVertical,
    LuHardDrive,
    LuHash,
    LuHeadphones,
    LuHeart,
    LuHeartCrack,
    LuImage,
    LuInfinity,
    LuInfo,
    LuKeyboard,
    LuLayoutGrid,
    LuLibrary,
    LuList,
    LuListFilter,
    LuListMinus,
    LuListMusic,
    LuListPlus,
    LuLoader,
    LuLock,
    LuLockOpen,
    LuLogIn,
    LuLogOut,
    LuMenu,
    LuMicVocal,
    LuMinus,
    LuMoon,
    LuMusic,
    LuMusic2,
    LuPanelRightClose,
    LuPanelRightOpen,
    LuPause,
    LuPencilLine,
    LuPin,
    LuPinOff,
    LuPlay,
    LuPlus,
    LuRadio,
    LuRotateCw,
    LuSave,
    LuSearch,
    LuSettings,
    LuSettings2,
    LuShare2,
    LuShieldAlert,
    LuShuffle,
    LuSkipBack,
    LuSkipForward,
    LuSlidersHorizontal,
    LuSquare,
    LuSquareCheck,
    LuSquareMenu,
    LuStar,
    LuStepBack,
    LuStepForward,
    LuSun,
    LuTable,
    LuTriangleAlert,
    LuUpload,
    LuUser,
    LuUserPen,
    LuUserRoundCog,
    LuVolume1,
    LuVolume2,
    LuVolumeX,
    LuWifi,
    LuWifiOff,
    LuX,
} from 'react-icons/lu';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';
import { PiMouseLeftClickFill, PiMouseRightClickFill } from 'react-icons/pi';
import { RiPlayListAddLine, RiRepeat2Line, RiRepeatOneLine } from 'react-icons/ri';
import { SiMusicbrainz } from 'react-icons/si';

import styles from './icon.module.css';

export type AppIconSelection = keyof typeof AppIcon;

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
    brandGitHub: LuGithub,
    brandLastfm: FaLastfmSquare,
    brandMusicBrainz: SiMusicbrainz,
    cache: LuCloudDownload,
    check: LuCheck,
    clipboardCopy: LuClipboardCopy,
    delete: LuDelete,
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
    externalLink: LuExternalLink,
    favorite: LuHeart,
    fileJson: LuFileJson,
    filter: LuListFilter,
    folder: LuFolderOpen,
    genre: LuFlag,
    hash: LuHash,
    home: LuSquareMenu,
    image: LuImage,
    info: LuInfo,
    itemAlbum: LuDisc3,
    itemSong: LuMusic,
    keyboard: LuKeyboard,
    lastPlayed: LuHeadphones,
    layoutGrid: LuLayoutGrid,
    layoutList: LuList,
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
    panelRightClose: LuPanelRightClose,
    panelRightOpen: LuPanelRightOpen,
    pin: LuPin,
    playlist: LuListMusic,
    playlistAdd: LuListPlus,
    playlistDelete: LuListMinus,
    plus: LuPlus,
    queue: LuList,
    radio: LuRadio,
    refresh: LuRotateCw,
    remove: LuMinus,
    save: LuSave,
    search: LuSearch,
    server: LuHardDrive,
    settings: LuSettings2,
    settings2: LuSettings,
    share: LuShare2,
    signIn: LuLogIn,
    signOut: LuLogOut,
    sort: LuArrowUpDown,
    sortAsc: LuArrowUpNarrowWide,
    sortDesc: LuArrowDownWideNarrow,
    spinner: LuLoader,
    square: LuSquare,
    squareCheck: LuSquareCheck,
    star: LuStar,
    success: LuCircleCheck,
    themeDark: LuMoon,
    themeLight: LuSun,
    track: LuMusic2,
    unfavorite: LuHeartCrack,
    unpin: LuPinOff,
    upload: LuUpload,
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

export interface IconProps extends Omit<IconBaseProps, 'color' | 'fill' | 'size'> {
    animate?: 'pulse' | 'spin';
    color?: IconColor;
    fill?: IconColor;
    icon: keyof typeof AppIcon;
    size?: '2xl' | '3xl' | '4xl' | '5xl' | 'lg' | 'md' | 'sm' | 'xl' | 'xs' | number | string;
}
type IconColor =
    | 'contrast'
    | 'default'
    | 'error'
    | 'favorite'
    | 'info'
    | 'inherit'
    | 'muted'
    | 'primary'
    | 'success'
    | 'warn';

const _Icon = forwardRef<HTMLDivElement, IconProps>((props, ref) => {
    const { animate, className, color, fill, icon, size = 'md' } = props;

    const IconComponent: ComponentType<any> = AppIcon[icon];

    const classNames = useMemo(
        () =>
            clsx(className, {
                [styles.fill]: true,
                [styles.pulse]: animate === 'pulse',
                [styles.spin]: animate === 'spin',
                [styles[`color-${color || fill}`]]: color || fill,
                [styles[`fill-${fill}`]]: fill,
                [styles[`size-${size}`]]: true,
            }),
        [animate, className, color, fill, size],
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
