import { useQueryClient } from '@tanstack/react-query';

import styles from './people.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { getSongById } from '/@/renderer/features/player/utils';
import { avatarUrl, type SourProfile, timeAgo } from '/@/renderer/features/sour/api/sour-api';
import { useCurrentServer } from '/@/renderer/store';
import { addToQueueByData, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const hue = (name: string) =>
    [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 360, 7);

export const NAME_FONTS: Record<string, string> = {
    default: 'inherit',
    mono: 'ui-monospace, Consolas, monospace',
    rounded: '"Trebuchet MS", "Comic Sans MS", sans-serif',
    script: '"Brush Script MT", "Segoe Script", cursive',
    serif: 'Georgia, "Times New Roman", serif',
};

// a person's picture with an online dot (a ring when offline, a bar for "do not disturb", so it
// doesn't rely on colour alone) and their profile frame
export const ProfileAvatar = ({
    online,
    profile,
    size = 40,
}: {
    online?: boolean;
    profile: Pick<SourProfile, 'avatar' | 'id' | 'name'> & Partial<Pick<SourProfile, 'custom'>>;
    size?: number;
}) => {
    const url = useHermesUrl();
    const src = avatarUrl(url, profile);
    const frame = profile.custom?.frame;
    const dnd = !!profile.custom?.dnd;
    return (
        <span
            className={frame === 'rainbow' ? styles.avatarRainbow : styles.avatar}
            style={{
                background: `hsl(${hue(profile.name)} 60% 42%)`,
                boxShadow: frame && frame !== 'rainbow' ? `0 0 0 3px ${frame}` : undefined,
                fontSize: size * 0.42,
                height: size,
                width: size,
            }}
        >
            {src ? (
                <img alt="" className={styles.avatarImage} src={src} />
            ) : (
                (profile.name.trim()[0] || '?').toUpperCase()
            )}
            {online !== undefined && (
                <span
                    className={dnd && online ? styles.dnd : online ? styles.online : styles.offline}
                    title={dnd && online ? 'Do not disturb' : online ? 'Online' : 'Offline'}
                />
            )}
        </span>
    );
};

export const SongCover = ({ size, song }: { size: number; song: GroupSong }) => {
    const serverId = useCurrentServer()?.id;
    return (
        <div className={styles.cover} style={{ height: size, width: size }}>
            {song.imageId && serverId && (
                <ItemImage
                    className={styles.coverImage}
                    containerClassName={styles.coverImage}
                    id={song.imageId}
                    itemType={LibraryItem.SONG}
                    serverId={serverId}
                    type="table"
                />
            )}
        </div>
    );
};

// album or artist picture from the shared music server
export const ItemCover = ({ entry, round }: { entry: GroupSong; round?: boolean }) => {
    const serverId = useCurrentServer()?.id;
    return (
        <div className={round ? styles.artistCover : styles.albumCover}>
            {entry.imageId && serverId && (
                <ItemImage
                    className={styles.coverImage}
                    containerClassName={styles.coverImage}
                    id={entry.imageId}
                    itemType={round ? LibraryItem.ALBUM_ARTIST : LibraryItem.ALBUM}
                    serverId={serverId}
                    type="itemCard"
                />
            )}
        </div>
    );
};

export const usePlaySong = () => {
    const queryClient = useQueryClient();
    const serverId = useCurrentServer()?.id;
    return (song: GroupSong, position?: number) => {
        if (!serverId) return Promise.resolve();
        return getSongById({ id: song.id, queryClient, serverId })
            .then((res) => addToQueueByData(Play.NOW, res.items))
            .then(() => {
                if (position) {
                    window.setTimeout(
                        () => usePlayerStoreBase.getState().mediaSeekToTimestamp(position),
                        400,
                    );
                }
            })
            .catch(() => toast.error({ message: `${song.title} isn't on your music server` }));
    };
};

export const activity = (p: SourProfile) => {
    if (!p.online) return p.lastSeen ? `Last online ${timeAgo(p.lastSeen)}` : 'Offline';
    if (p.group && p.listening) return `${p.listening.title} - in ${p.group.name}`;
    if (p.listening) {
        const verb = p.playing ? 'Listening to' : 'Paused';
        return `${verb} ${p.listening.title} by ${p.listening.artist}`;
    }
    return p.status || 'Online';
};

export const isBirthday = (p: Pick<SourProfile, 'custom'>) =>
    !!p.custom?.birthday && p.custom.birthday.slice(-5) === new Date().toISOString().slice(5, 10);

// the name line: chosen font and effect, emoji, and the nickname friends gave them
export const ProfileName = ({ profile, size = 22 }: { profile: SourProfile; size?: number }) => {
    const c = profile.custom || {};
    const effect =
        c.nameEffect === 'shimmer'
            ? styles.nameShimmer
            : c.nameEffect === 'rainbow'
              ? styles.nameRainbow
              : c.nameEffect === 'glow'
                ? styles.nameGlow
                : undefined;
    return (
        <span className={styles.nameLine}>
            <span
                className={effect}
                style={{ fontFamily: NAME_FONTS[c.nameFont || 'default'], fontSize: size }}
            >
                {profile.name}
            </span>
            {c.emoji && <span style={{ fontSize: size * 0.8 }}>{c.emoji}</span>}
            {isBirthday(profile) && (
                <span style={{ fontSize: size * 0.8 }} title="Birthday today">
                    &#127874;
                </span>
            )}
            {c.nickname && <span className={styles.nickname}>aka {c.nickname}</span>}
        </span>
    );
};
