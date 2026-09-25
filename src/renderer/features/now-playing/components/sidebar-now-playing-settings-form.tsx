import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import {
    ListConfigBooleanControl,
    ListConfigTable,
} from '/@/renderer/features/shared/components/list-config-menu';
import { TableColumnConfig } from '/@/renderer/features/shared/components/table-config';
import {
    SidebarNowPlayingItem,
    SidebarNowPlayingSection,
    useSettingsStoreActions,
    useSidebarNowPlayingSettings,
} from '/@/renderer/store';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { Stack } from '/@/shared/components/stack/stack';

const NOW_PLAYING_ITEM_LABELS: { label: string; value: string }[] = [
    { label: 'setting.nowPlaying_showTrackArt', value: SidebarNowPlayingItem.TRACK_ART },
    { label: 'setting.nowPlaying_showTrackArtist', value: SidebarNowPlayingItem.TRACK_ARTIST },
    { label: 'setting.nowPlaying_showAlbum', value: SidebarNowPlayingItem.ALBUM },
    {
        label: 'setting.nowPlaying_showArtistActions',
        value: SidebarNowPlayingItem.ARTIST_ACTIONS,
    },
    { label: 'setting.nowPlaying_showArtistCard', value: SidebarNowPlayingItem.ARTIST_CARD },
    { label: 'setting.nowPlaying_showArtistBio', value: SidebarNowPlayingItem.ARTIST_BIO },
    { label: 'setting.nowPlaying_showGenres', value: SidebarNowPlayingItem.GENRES },
    { label: 'setting.nowPlaying_showExternalLinks', value: SidebarNowPlayingItem.EXTERNAL_LINKS },
    {
        label: 'setting.nowPlaying_showTopSongs',
        value: SidebarNowPlayingItem.TOP_SONGS,
    },
    {
        label: 'setting.nowPlaying_showSimilarArtists',
        value: SidebarNowPlayingItem.SIMILAR_ARTISTS,
    },
];

export const SidebarNowPlayingSettingsForm = () => {
    const { t } = useTranslation();
    const settings = useSidebarNowPlayingSettings();
    const { setSettings, setSidebarNowPlayingItems } = useSettingsStoreActions();

    const sectionLabels = useMemo(
        () =>
            NOW_PLAYING_ITEM_LABELS.map((item) => ({
                label: t(item.label),
                value: item.value,
            })),
        [t],
    );

    const behaviorOptions = useMemo(
        () => [
            {
                component: (
                    <ListConfigBooleanControl
                        onChange={(value) =>
                            setSettings({ sidebarNowPlaying: { autoOpenOnPlay: value } })
                        }
                        value={settings.autoOpenOnPlay}
                    />
                ),
                description: t('setting.nowPlaying_autoOpenOnPlay_description'),
                id: 'autoOpenOnPlay',
                label: t('setting.nowPlaying_autoOpenOnPlay'),
            },
        ],
        [setSettings, settings.autoOpenOnPlay, t],
    );

    return (
        <Stack gap="sm">
            <Fieldset legend={t('page.setting.nowPlayingBehavior')} p="md">
                <ListConfigTable options={behaviorOptions} />
            </Fieldset>
            <Fieldset legend={t('page.setting.nowPlayingDisplay')} p="md">
                <TableColumnConfig
                    data={sectionLabels}
                    enablePinColumnButtons={false}
                    onChange={(items) =>
                        setSidebarNowPlayingItems(items as SidebarNowPlayingSection[])
                    }
                    title={t('setting.nowPlaying_itemConfiguration')}
                    value={settings.items as ItemTableListColumnConfig[]}
                />
            </Fieldset>
        </Stack>
    );
};
