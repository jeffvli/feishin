import { useTranslation } from 'react-i18next';

import styles from './discover-news.module.css';

import { useDiscoverNews } from '/@/renderer/features/discover/hooks/use-discover-news';
import { formatDateRelative } from '/@/renderer/utils/format';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';

/**
 * What happened this week to artists the library already holds.
 *
 * The one section on the page that is not a recommendation. Everything above answers "what
 * should I play next"; this answers "what did I miss", which is a question only something that
 * knows the whole library can ask on the reader's behalf.
 *
 * Text rather than cards, and no artwork, on purpose. Four image-heavy rows precede it, and a
 * fifth would read as more of the same when the point is that this is a different kind of
 * thing. It is also the one part of the page whose value is entirely in the words.
 *
 * Renders nothing at all when no article matches. An unfiltered headline list is a different
 * feature, and an empty panel under a heading is worse than no heading.
 */
export function DiscoverNews() {
    const { t } = useTranslation();
    const { articles } = useDiscoverNews();

    if (articles.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">
            <Stack gap={2}>
                <TextTitle fw={700} isNoSelect order={3}>
                    {t('page.discover.news')}
                </TextTitle>
                <Text isMuted size="sm">
                    {t('page.discover.newsSubtitle')}
                </Text>
            </Stack>
            <ul className={styles.articles}>
                {articles.map((article) => {
                    // Any of the three can be missing: a feed can omit the byline, and a date
                    // that would not parse is stored as 0 rather than guessed at.
                    const meta = [
                        article.outlet,
                        article.author,
                        formatDateRelative(
                            article.publishedAt
                                ? new Date(article.publishedAt).toISOString()
                                : null,
                        ),
                    ].filter(Boolean);

                    return (
                        <li className={styles.article} key={article.link}>
                            <a
                                className={styles.link}
                                href={article.link}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <Text className={styles.headline} lineClamp={2} size="md">
                                    {article.title}
                                </Text>
                                <Text isMuted size="xs">
                                    {meta.join(' · ')}
                                </Text>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </Stack>
    );
}
