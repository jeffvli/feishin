import { closeAllModals, openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useDownloadedSongList, useDownloadsActions, useDownloadsStore } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { toast } from '/@/shared/components/toast/toast';

const downloads = isElectron() ? window.api.downloads : null;

export const DownloadsSettings = memo(() => {
    const { t } = useTranslation();
    const folder = useDownloadsStore((s) => s.folder);
    const songs = useDownloadedSongList();
    const { applyManifestSnapshot, setFolder } = useDownloadsActions();

    const pickFolder = useCallback(async () => {
        if (!downloads) return;
        try {
            const m = await downloads.pickFolder();
            setFolder(m.folder);
            applyManifestSnapshot(m.songs);
        } catch (err) {
            toast.error({ message: (err as Error).message });
        }
    }, [applyManifestSnapshot, setFolder]);

    const clearAll = useCallback(async () => {
        if (!downloads) return;
        const ids = songs.map((s) => ({
            serverId: s.serverId,
            songId: s.songId,
        }));
        const m = await downloads.delete(ids);
        applyManifestSnapshot(m.songs);
        toast.success({
            message: t('setting.clearDownloads_description', {
                defaultValue: 'Downloads cleared',
            }),
        });
        closeAllModals();
    }, [applyManifestSnapshot, songs, t]);

    if (!downloads) return null;

    const totalBytes = songs.reduce((acc, s) => acc + s.bytes, 0);
    const mb = (totalBytes / (1024 * 1024)).toFixed(1);

    const options: SettingOption[] = [
        {
            control: (
                <Button onClick={pickFolder} size="compact-md" variant="filled">
                    {t('setting.changeFolder', { defaultValue: 'Change folder' })}
                </Button>
            ),
            description:
                folder ||
                t('setting.downloadsFolder_description', {
                    defaultValue: 'Where downloaded songs are stored',
                }),
            title: t('setting.downloadsFolder', {
                defaultValue: 'Downloads folder',
            }),
        },
        {
            control: (
                <Button
                    disabled={songs.length === 0}
                    onClick={() =>
                        openModal({
                            children: (
                                <ConfirmModal onConfirm={clearAll}>
                                    {t('common.areYouSure', {
                                        defaultValue: 'Are you sure?',
                                    })}
                                </ConfirmModal>
                            ),
                            title: t('setting.clearDownloads', {
                                defaultValue: 'Clear downloads',
                            }),
                        })
                    }
                    size="compact-md"
                    variant="filled"
                >
                    {t('common.clear', { defaultValue: 'Clear' })}
                </Button>
            ),
            description: `${songs.length} songs · ${mb} MB`,
            title: t('setting.clearDownloads', {
                defaultValue: 'Clear all downloads',
            }),
        },
    ];

    return (
        <SettingsSection
            options={options}
            title={t('setting.downloads', { defaultValue: 'Downloads' })}
        />
    );
});
