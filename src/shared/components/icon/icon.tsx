import clsx from 'clsx';
import { motion } from 'motion/react';
import { type ComponentType, forwardRef } from 'react';
import { IconBaseProps } from 'react-icons';
import { FaLastfmSquare } from 'react-icons/fa';
import {
    LuAppWindow,
    LuArrowDown,
    LuArrowDownToLine,
    LuArrowDownWideNarrow,
    LuArrowLeft,
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
    LuDisc3,
    LuDownload,
    LuEllipsis,
    LuEllipsisVertical,
    LuExternalLink,
    LuFlag,
    LuFolderOpen,
    LuGauge,
    LuGithub,
    LuGripHorizontal,
    LuGripVertical,
    LuHardDrive,
    LuHash,
    LuHeart,
    LuHeartCrack,
    LuImage,
    LuImageOff,
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
    LuLogIn,
    LuLogOut,
    LuMenu,
    LuMinus,
    LuMusic,
    LuMusic2,
    LuPanelRightClose,
    LuPanelRightOpen,
    LuPause,
    LuPencilLine,
    LuPlay,
    LuPlus,
    LuRadio,
    LuRotateCw,
    LuSave,
    LuSearch,
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
    LuTable,
    LuTriangleAlert,
    LuUser,
    LuUserPen,
    LuUserRoundCog,
    LuVolume1,
    LuVolume2,
    LuVolumeX,
    LuX,
} from 'react-icons/lu';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';
import { RiPlayListAddLine, RiRepeat2Line, RiRepeatOneLine } from 'react-icons/ri';
import { SiMusicbrainz } from 'react-icons/si';

import styles from './icon.module.css';

export type AppIconSelection = keyof typeof AppIcon;

export const AppIcon = {
    add: LuPlus,
    album: LuDisc3,
    appWindow: LuAppWindow,
    arrowDown: LuArrowDown,
    arrowDownS: LuChevronDown,
    arrowDownToLine: LuArrowDownToLine,
    arrowLeft: LuArrowLeft,
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
    download: LuDownload,
    dragHorizontal: LuGripHorizontal,
    dragVertical: LuGripVertical,
    dropdown: LuChevronDown,
    duration: LuClock3,
    edit: LuPencilLine,
    ellipsisHorizontal: LuEllipsis,
    ellipsisVertical: LuEllipsisVertical,
    emptyImage: LuImageOff,
    error: LuShieldAlert,
    externalLink: LuExternalLink,
    favorite: LuHeart,
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
    layoutGrid: LuLayoutGrid,
    layoutList: LuList,
    layoutTable: LuTable,
    library: LuLibrary,
    list: LuList,
    listInfinite: LuInfinity,
    listPaginated: LuArrowRightToLine,
    lock: LuLock,
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
    minus: LuMinus,
    panelRightClose: LuPanelRightClose,
    panelRightOpen: LuPanelRightOpen,
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
    track: LuMusic2,
    unfavorite: LuHeartCrack,
    user: LuUser,
    userManage: LuUserRoundCog,
    visibility: MdOutlineVisibility,
    visibilityOff: MdOutlineVisibilityOff,
    volumeMax: LuVolume2,
    volumeMute: LuVolumeX,
    volumeNormal: LuVolume1,
    warn: LuTriangleAlert,
    x: LuX,
    xCircle: LuCircleX,
} as const;

export interface IconProps extends Omit<IconBaseProps, 'color' | 'fill' | 'size'> {
    animate?: 'pulse' | 'spin';
    color?: 'default' | 'error' | 'info' | 'inherit' | 'muted' | 'primary' | 'success' | 'warn';
    fill?: 'default' | 'error' | 'info' | 'inherit' | 'muted' | 'primary' | 'success' | 'warn';
    icon: keyof typeof AppIcon;
    size?: '2xl' | '3xl' | '4xl' | '5xl' | 'lg' | 'md' | 'sm' | 'xl' | 'xs' | number | string;
}

export const Icon = forwardRef<HTMLDivElement, IconProps>((props, ref) => {
    const { animate, className, color, fill, icon, size = 'md' } = props;

    const IconComponent: ComponentType<any> = AppIcon[icon];

    const classNames = clsx(className, {
        [styles.fill]: true,
        [styles.pulse]: animate === 'pulse',
        [styles.spin]: animate === 'spin',
        [styles[`color-${color || fill}`]]: color || fill,
        [styles[`fill-${fill}`]]: fill,
        [styles[`size-${size}`]]: true,
    });

    return (
        <IconComponent
            className={classNames}
            fill={fill}
            ref={ref}
            size={isPredefinedSize(size) ? undefined : size}
        />
    );
});

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
