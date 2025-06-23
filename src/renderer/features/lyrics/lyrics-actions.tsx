import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import { openLyricSearchModal } from '/@/renderer/features/lyrics/components/lyrics-search-form';
import {
    useCurrentSong,
    useLyricsSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { LyricsOverride } from '/@/shared/types/domain-types';

interface LyricsActionsProps {
    index: number;
    languages: { label: string; value: string }[];

    onRemoveLyric: () => void;
    onResetLyric: () => void;
    onSearchOverride: (params: LyricsOverride) => void;
    onTranslateLyric: () => void;
    setIndex: (idx: number) => void;
}

export const LyricsActions = ({
    index,
    languages,
    onRemoveLyric,
    onResetLyric,
    onSearchOverride,
    onTranslateLyric,
    setIndex,
}: LyricsActionsProps) => {
    const { t } = useTranslation();
    const currentSong = useCurrentSong();
    const { setSettings } = useSettingsStoreActions();
    const { delayMs, sources } = useLyricsSettings();

    const handleLyricOffset = (e: number | string) => {
        setSettings({
            lyrics: {
                ...useSettingsStore.getState().lyrics,
                delayMs: Number(e),
            },
        });
    };

    const isActionsDisabled = !currentSong;
    const isDesktop = isElectron();

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {languages.length > 1 && (
                <Center>
                    <Select
                        clearable={false}
                        data={languages}
                        onChange={(value) => setIndex(parseInt(value!, 10))}
                        style={{ bottom: 30, position: 'absolute' }}
                        value={index.toString()}
                    />
                </Center>
            )}

            <Group justify="center">
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={() =>
                            openLyricSearchModal({
                                artist: currentSong?.artistName,
                                name: currentSong?.name,
                                onSearchOverride,
                            })
                        }
                        uppercase
                        variant="subtle"
                    >
                        {t('common.search', { postProcess: 'titleCase' })}
                    </Button>
                ) : null}
                <ActionIcon
                    aria-label="Decrease lyric offset"
                    icon="minus"
                    onClick={() => handleLyricOffset(delayMs - 50)}
                    variant="subtle"
                />
                <Tooltip
                    label={t('setting.lyricOffset', { postProcess: 'sentenceCase' })}
                    openDelay={500}
                >
                    <NumberInput
                        aria-label="Lyric offset"
                        onChange={handleLyricOffset}
                        styles={{ input: { textAlign: 'center' } }}
                        value={delayMs || 0}
                        width={55}
                    />
                </Tooltip>
                <ActionIcon
                    aria-label="Increase lyric offset"
                    icon="plus"
                    onClick={() => handleLyricOffset(delayMs + 50)}
                    variant="subtle"
                />
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onResetLyric}
                        uppercase
                        variant="subtle"
                    >
                        {t('common.reset', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </Group>

            <div style={{ position: 'absolute', right: 0, top: 0 }}>
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onRemoveLyric}
                        uppercase
                        variant="subtle"
                    >
                        {t('common.clear', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </div>

            <div style={{ position: 'absolute', right: 0, top: -50 }}>
                {isDesktop && sources.length ? (
                    <Button
                        disabled={isActionsDisabled}
                        onClick={onTranslateLyric}
                        uppercase
                        variant="subtle"
                    >
                        {t('common.translation', { postProcess: 'sentenceCase' })}
                    </Button>
                ) : null}
            </div>
        </div>
    );
};
