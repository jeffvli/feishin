import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './discover-social.module.css';

import { ListenerChip } from '/@/renderer/features/discover/components/listener-chip';
import { SimilarityRing } from '/@/renderer/features/discover/components/similarity-ring';
import { useDiscoverSocial } from '/@/renderer/features/discover/hooks/use-discover-social';
import { coverArtUrl } from '/@/renderer/features/discover/utils/lb-adapters';
import { similarityScale } from '/@/renderer/features/discover/utils/similarity-scale';
import { FeedEntry } from '/@/renderer/features/discover/utils/social-feed';
import {
    usePreviewActions,
    usePreviewPlayingId,
    usePreviewResolvingId,
} from '/@/renderer/features/preview/preview-store';
import { formatDateRelative } from '/@/renderer/utils/format';
import { Button } from '/@/shared/components/button/button';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

interface DiscoverSocialProps {
    username: string;
}

/**
 * What the people this user follows have been playing.
 *
 * The one section on the page whose recommendations come from named people rather than a model,
 * which is also why it is a list of sentences rather than another row of covers.
 *
 * Tracks the user does not own are shown first and ones they do are demoted, because a section
 * about discovery should lead with what cannot already be played from the library. Owned tracks
 * are kept as filler rather than dropped so a quiet day still fills the section.
 */
export function DiscoverSocial(props: DiscoverSocialProps) {
    const { username } = props;
    const { t } = useTranslation();
    const { entries, isEmpty, isLoading, peers } = useDiscoverSocial(username);

    // Nothing to say yet, and a heading over a spinner is worse than waiting a moment.
    if (isLoading) {
        return null;
    }

    if (!isEmpty && entries.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">
            <Stack gap={2}>
                <TextTitle fw={700} isNoSelect order={3}>
                    {t('page.discover.social')}
                </TextTitle>
                <Text isMuted size="sm">
                    {isEmpty
                        ? t('page.discover.socialEmptySubtitle')
                        : t('page.discover.socialSubtitle')}
                </Text>
            </Stack>
            {isEmpty ? <EmptyState peers={peers} /> : <FeedList entries={entries} />}
        </Stack>
    );
}

/**
 * The invitation shown to someone following nobody.
 *
 * A bare link out would be a dead end, and the data to do better is already on the page: the
 * recommendation rows seed from the same similar-users query, so naming the people worth
 * following costs nothing and makes the suggestion concrete rather than an errand.
 */
function EmptyState({ peers }: { peers: Array<{ similarity: number; username: string }> }) {
    const { t } = useTranslation();

    // Dial and number together, because neither carries the whole answer alone: the dial is
    // partly relative to the group so the ordering is legible, and the number is absolute so
    // nothing is overstated. See `similarityScale`.
    const fillFor = useMemo(() => similarityScale(peers.map((peer) => peer.similarity)), [peers]);

    return (
        <div className={styles.empty}>
            <Text isMuted size="sm">
                {t('page.discover.socialEmptyBody')}
            </Text>
            {peers.length > 0 && (
                <div className={styles.peers}>
                    {peers.map((peer) => (
                        <div className={styles.peer} key={peer.username}>
                            <ListenerChip username={peer.username} />
                            <a
                                className={styles.peerName}
                                href={`https://listenbrainz.org/user/${encodeURIComponent(peer.username)}/`}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <Text size="sm">{peer.username}</Text>
                            </a>
                            <div className={styles.peerScore}>
                                <SimilarityRing fill={fillFor(peer.similarity)} />
                                <Text className={styles.scoreValue} isMuted size="xs">
                                    {Math.round(peer.similarity * 100)}%
                                </Text>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Button
                className={styles.followLink}
                component="a"
                href="https://listenbrainz.org/explore/similar-users/"
                rel="noopener noreferrer"
                size="sm"
                target="_blank"
                variant="filled"
            >
                {t('page.discover.socialFindPeople')}
            </Button>
        </div>
    );
}

function FeedList({ entries }: { entries: FeedEntry[] }) {
    const { t } = useTranslation();
    const playingId = usePreviewPlayingId();
    const resolvingId = usePreviewResolvingId();
    const { toggle } = usePreviewActions();

    return (
        <ul className={styles.listens}>
            {entries.map((entry) => {
                const isPlaying = playingId === entry.id;
                const isResolving = resolvingId === entry.id;
                const image = coverArtUrl(entry.caaReleaseMbid, entry.caaId);

                return (
                    <li className={styles.listen} key={entry.id}>
                        <button
                            aria-label={t('page.discover.socialPlay', { title: entry.title })}
                            className={styles.play}
                            onClick={() =>
                                void toggle(entry.id, {
                                    artistName: entry.artistName,
                                    title: entry.title,
                                    urlRels: entry.urlRels,
                                })
                            }
                            type="button"
                        >
                            <span
                                className={styles.playIcon}
                                data-active={isPlaying || isResolving}
                            >
                                {isResolving ? (
                                    <Spinner size={12} />
                                ) : (
                                    <Icon icon={isPlaying ? 'mediaPause' : 'mediaPlay'} size="xs" />
                                )}
                            </span>
                            {image && (
                                <img alt="" className={styles.art} loading="lazy" src={image} />
                            )}
                        </button>
                        <div>
                            <div className={styles.title}>
                                <Text className={styles.titleText} size="md">
                                    {entry.title}
                                </Text>
                                {entry.isOwned && (
                                    <span className={styles.owned}>
                                        {t('page.discover.socialOwned')}
                                    </span>
                                )}
                            </div>
                            <Text className={styles.subtitle} isMuted size="xs">
                                {entry.artistName}
                            </Text>
                        </div>
                        <div className={styles.cluster}>
                            {entry.listeners.map((listener) => (
                                <Tooltip key={listener} label={listener} openDelay={200}>
                                    <a
                                        aria-label={listener}
                                        className={styles.avatar}
                                        href={`https://listenbrainz.org/user/${encodeURIComponent(listener)}/`}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        <ListenerChip username={listener} />
                                    </a>
                                </Tooltip>
                            ))}
                        </div>
                        <Text className={styles.time} isMuted size="xs">
                            {formatDateRelative(new Date(entry.playedAt).toISOString())}
                        </Text>
                    </li>
                );
            })}
        </ul>
    );
}
