import { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './discover-history-banner.module.css';

import { Text } from '/@/shared/components/text/text';

interface DiscoverHistoryBannerProps {
    /** Listens read so far, live during a pass and from the stored index between them. */
    done: number;
    /** Seconds left, or null while the estimate would still be guesswork. */
    etaSeconds: null | number;
    /** Listens ListenBrainz reports in total, or 0 before the count has been fetched. */
    total: number;
}

/**
 * Says that the rows above are built on a history that is still being read.
 *
 * The page used to withhold every row until the walk finished, which on a six-figure history is
 * several minutes of watching a progress bar. It now renders immediately and filters against
 * whatever has been read, and this is the sentence that makes that honest: without it a partial
 * result is indistinguishable from a finished one, which is the thing worth avoiding, not the
 * partial result itself.
 *
 * Two lines, because the reader needs two different facts. The first is what is happening and
 * how long it has to run. The second is what will change on screen, which is the one that stops
 * a familiar track being read as a bad recommendation.
 */
export function DiscoverHistoryBanner(props: DiscoverHistoryBannerProps) {
    const { done, etaSeconds, total } = props;
    const { t } = useTranslation();

    const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0;

    return (
        <div
            className={styles.banner}
            style={{ '--discover-history-progress': `${percent}%` } as CSSProperties}
        >
            <Text size="sm">
                {total === 0
                    ? t('page.discover.historyPartialStart')
                    : etaSeconds !== null
                      ? t('page.discover.historyPartialEta', {
                            done: done.toLocaleString(),
                            eta: formatEta(etaSeconds),
                            total: total.toLocaleString(),
                        })
                      : t('page.discover.historyPartial', {
                            done: done.toLocaleString(),
                            total: total.toLocaleString(),
                        })}
            </Text>
            <Text isMuted size="xs">
                {t('page.discover.historyPartialDetail')}
            </Text>
        </div>
    );
}

/**
 * A duration a reader can act on, rather than a number of seconds.
 *
 * Rounded up to the minute above a minute, because an estimate that counts down in single
 * seconds over a seven minute wait invites watching it, and its own accuracy does not justify
 * that much precision.
 */
function formatEta(seconds: number): string {
    if (seconds < 60) {
        return `${Math.max(1, seconds)}s`;
    }

    return `${Math.ceil(seconds / 60)} min`;
}
