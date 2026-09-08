import { useLocation, useNavigate } from 'react-router';

import styles from './mini-player-bar.module.css';

import { Thumbnail } from '/@/remote/components/thumbnail';
import { useInfo, useSend } from '/@/remote/store';
import { useRadioStatus } from '/@/remote/store/library';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { PlayerStatus } from '/@/shared/types/types';

// Persistent now-playing strip shown above the tab bar on every tab except
// Home (which already has the full player). Mirrors the "mini playbar over a
// bottom tab bar" pattern — layout only, this app's own components/tokens
// throughout, not that project's styling.
export const MiniPlayerBar = () => {
    const { song, status } = useInfo();
    const send = useSend();
    const radioStatus = useRadioStatus();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isPlayable = radioStatus.isActive || !!song?.id;

    if (pathname === '/' || !isPlayable) return null;

    const artworkSrc = radioStatus.isActive ? radioStatus.imageUrl : (song?.imageUrl ?? null);
    const title = radioStatus.isActive ? radioStatus.stationName : song?.name;
    const subtitle = radioStatus.isActive ? 'Radio' : song?.artistName;

    return (
        // Not a <button> — it contains its own play/pause and skip buttons,
        // and a button can't nest another button. Each inner ActionIcon stops
        // propagation so tapping a control doesn't also navigate home.
        <div className={styles.bar} onClick={() => navigate('/')}>
            <Thumbnail
                fallbackIcon={
                    <Icon icon={radioStatus.isActive ? 'emptyImage' : 'emptySongImage'} size={16} />
                }
                // Safe here for the same reason as remote-container.tsx's
                // player thumbnail: this always shows the current song/radio,
                // which is exactly what the server's 'proxy' relay answers.
                onError={() => send({ event: 'proxy' })}
                size={44}
                src={artworkSrc}
            />
            <Stack className={styles.info} gap={0}>
                <Text
                    fw={600}
                    isNoSelect
                    size="sm"
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                    {title}
                </Text>
                <Text
                    isMuted
                    isNoSelect
                    size="xs"
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                    {subtitle}
                </Text>
            </Stack>
            <ActionIcon
                disabled={radioStatus.isActive}
                icon="mediaPrevious"
                iconProps={{ fill: 'default', size: 'lg' }}
                onClick={(e) => {
                    e.stopPropagation();
                    send({ event: 'previous' });
                }}
                tooltip={{ label: 'Previous track' }}
                variant="transparent"
            />
            <ActionIcon
                icon={status === PlayerStatus.PLAYING ? 'mediaPause' : 'mediaPlay'}
                iconProps={{ fill: 'default', size: 'lg' }}
                onClick={(e) => {
                    e.stopPropagation();
                    send({ event: status === PlayerStatus.PLAYING ? 'pause' : 'play' });
                }}
                tooltip={{ label: status === PlayerStatus.PLAYING ? 'Pause' : 'Play' }}
                variant="transparent"
            />
            <ActionIcon
                disabled={radioStatus.isActive}
                icon="mediaNext"
                iconProps={{ fill: 'default', size: 'lg' }}
                onClick={(e) => {
                    e.stopPropagation();
                    send({ event: 'next' });
                }}
                tooltip={{ label: 'Next track' }}
                variant="transparent"
            />
        </div>
    );
};
