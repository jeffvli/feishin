import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import { ChangeEvent, KeyboardEvent, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './hotkeys-manager-settings.module.css';

import i18n from '/@/i18n/i18n';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useSettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { BindingActions, useHotkeySettings, useSettingsStoreActions } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Icon } from '/@/shared/components/icon/icon';
import { Table } from '/@/shared/components/table/table';
import { TextInput } from '/@/shared/components/text-input/text-input';

const ipc = isElectron() ? window.api.ipc : null;

const BINDINGS_MAP: Record<BindingActions, string> = {
    browserBack: i18n.t('setting.hotkey', { context: 'browserBack' }),
    browserForward: i18n.t('setting.hotkey', {
        context: 'browserForward',
    }),
    favoriteCurrentAdd: i18n.t('setting.hotkey', {
        context: 'favoriteCurrentSong',
    }),
    favoriteCurrentRemove: i18n.t('setting.hotkey', {
        context: 'unfavoriteCurrentSong',
    }),
    favoriteCurrentToggle: i18n.t('setting.hotkey', {
        context: 'toggleCurrentSongFavorite',
    }),
    favoritePreviousAdd: i18n.t('setting.hotkey', {
        context: 'favoritePreviousSong',
    }),
    favoritePreviousRemove: i18n.t('setting.hotkey', {
        context: 'unfavoritePreviousSong',
    }),
    favoritePreviousToggle: i18n.t('setting.hotkey', {
        context: 'togglePreviousSongFavorite',
    }),
    globalSearch: i18n.t('setting.hotkey', {
        context: 'globalSearch',
    }),
    listNavigateToPage: i18n.t('setting.hotkey', {
        context: 'listNavigateToPage',
    }),
    listPlayDefault: i18n.t('setting.hotkey', {
        context: 'listPlayDefault',
    }),
    listPlayLast: i18n.t('setting.hotkey', {
        context: 'listPlayLast',
    }),
    listPlayNext: i18n.t('setting.hotkey', {
        context: 'listPlayNext',
    }),
    listPlayNow: i18n.t('setting.hotkey', { context: 'listPlayNow' }),
    listShowPlayingSong: i18n.t('setting.hotkey', { context: 'listShowPlayingSong' }),
    localSearch: i18n.t('setting.hotkey', { context: 'localSearch' }),
    navigateHome: i18n.t('setting.hotkey', {
        context: 'navigateHome',
    }),
    next: i18n.t('setting.hotkey', { context: 'playbackNext' }),
    pause: i18n.t('setting.hotkey', { context: 'playbackPause' }),
    play: i18n.t('setting.hotkey', { context: 'playbackPlay' }),
    playPause: i18n.t('setting.hotkey', {
        context: 'playbackPlayPause',
    }),
    previous: i18n.t('setting.hotkey', {
        context: 'playbackPrevious',
    }),
    rate0: i18n.t('setting.hotkey', { context: 'rate0' }),
    rate1: i18n.t('setting.hotkey', { context: 'rate1' }),
    rate2: i18n.t('setting.hotkey', { context: 'rate2' }),
    rate3: i18n.t('setting.hotkey', { context: 'rate3' }),
    rate4: i18n.t('setting.hotkey', { context: 'rate4' }),
    rate5: i18n.t('setting.hotkey', { context: 'rate5' }),
    skipBackward: i18n.t('setting.hotkey', {
        context: 'skipBackward',
    }),
    skipForward: i18n.t('setting.hotkey', { context: 'skipForward' }),
    stop: i18n.t('setting.hotkey', { context: 'playbackStop' }),
    toggleFullscreenPlayer: i18n.t('setting.hotkey', {
        context: 'toggleFullScreenPlayer',
    }),
    toggleQueue: i18n.t('setting.hotkey', { context: 'toggleQueue' }),
    toggleRepeat: i18n.t('setting.hotkey', {
        context: 'toggleRepeat',
    }),
    toggleShuffle: i18n.t('setting.hotkey', {
        context: 'toggleShuffle',
    }),
    volumeDown: i18n.t('setting.hotkey', { context: 'volumeDown' }),
    volumeMute: i18n.t('setting.hotkey', { context: 'volumeMute' }),
    volumeUp: i18n.t('setting.hotkey', { context: 'volumeUp' }),
    zoomIn: i18n.t('setting.hotkey', { context: 'zoomIn' }),
    zoomOut: i18n.t('setting.hotkey', { context: 'zoomOut' }),
};

export const HotkeyManagerSettings = memo(() => {
    const { t } = useTranslation();
    const { bindings } = useHotkeySettings();
    const { setSettings } = useSettingsStoreActions();
    const [selected, setSelected] = useState<BindingActions | null>(null);
    const keyword = useSettingSearchContext();

    const debouncedSetHotkey = debounce(
        (binding: BindingActions, e: KeyboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const IGNORED_KEYS = ['Control', 'Alt', 'Shift', 'Meta', ' ', 'Escape'];
            const keys: string[] = [];
            if (e.ctrlKey) keys.push('mod');
            if (e.altKey) keys.push('alt');
            if (e.shiftKey) keys.push('shift');
            if (e.metaKey) keys.push('meta');
            if (e.key === ' ') keys.push('space');
            if (!IGNORED_KEYS.includes(e.key)) {
                if (e.code.includes('Numpad')) {
                    if (e.key === '+') keys.push('numpadadd');
                    else if (e.key === '-') keys.push('numpadsubtract');
                    else if (e.key === '*') keys.push('numpadmultiply');
                    else if (e.key === '/') keys.push('numpaddivide');
                    else if (e.key === '.') keys.push('numpaddecimal');
                    else keys.push(`numpad${e.key}`.toLowerCase());
                } else if (e.key === '+') {
                    keys.push('equal');
                } else {
                    keys.push(e.key?.toLowerCase());
                }
            }

            const bindingString = keys.join('+');

            const updatedBindings = {
                ...bindings,
                [binding]: { ...bindings[binding], hotkey: bindingString },
            };

            setSettings({
                hotkeys: {
                    bindings: updatedBindings,
                },
            });

            ipc?.send('set-global-shortcuts', updatedBindings);
        },
        20,
    );

    const handleSetHotkey = useCallback(
        (binding: BindingActions, e: KeyboardEvent<HTMLInputElement>) => {
            debouncedSetHotkey(binding, e);
        },
        [debouncedSetHotkey],
    );

    const handleSetGlobalHotkey = useCallback(
        (binding: BindingActions, e: ChangeEvent<HTMLInputElement>) => {
            const updatedBindings = {
                ...bindings,
                [binding]: { ...bindings[binding], isGlobal: e.currentTarget.checked },
            };

            setSettings({
                hotkeys: {
                    bindings: updatedBindings,
                },
            });

            ipc?.send('set-global-shortcuts', updatedBindings);
        },
        [bindings, setSettings],
    );

    const handleClearHotkey = useCallback(
        (binding: BindingActions) => {
            const updatedBindings = {
                ...bindings,
                [binding]: { ...bindings[binding], hotkey: '', isGlobal: false },
            };

            setSettings({
                hotkeys: {
                    bindings: updatedBindings,
                },
            });

            ipc?.send('set-global-shortcuts', updatedBindings);
        },
        [bindings, setSettings],
    );

    const duplicateHotkeyMap = useMemo(() => {
        const countPerHotkey = Object.values(bindings).reduce(
            (acc, key) => {
                const hotkey = key.hotkey;
                if (!hotkey) return acc;

                if (acc[hotkey]) {
                    acc[hotkey] += 1;
                } else {
                    acc[hotkey] = 1;
                }

                return acc;
            },
            {} as Record<string, number>,
        );

        const duplicateKeys = Object.keys(countPerHotkey).filter((key) => countPerHotkey[key] > 1);

        return duplicateKeys;
    }, [bindings]);

    const filteredBindings = useMemo(() => {
        const base = Object.keys(bindings);

        if (keyword === '') {
            return base.filter((binding) => BINDINGS_MAP[binding as keyof typeof BINDINGS_MAP]);
        }

        return base.filter((binding) => {
            const item = BINDINGS_MAP[binding as keyof typeof BINDINGS_MAP];
            if (!item) return false;

            return item.toLocaleLowerCase().includes(keyword);
        });
    }, [bindings, keyword]);

    const options: SettingOption[] = [];

    return (
        <SettingsSection
            extra={
                <>
                    <SettingsOptions
                        control={<></>}
                        description={t('setting.applicationHotkeys', {
                            context: 'description',
                        })}
                        title={t('setting.applicationHotkeys')}
                    />
                    <div className={styles.container}>
                        <Table withColumnBorders withRowBorders>
                            <Table.Tbody>
                                {filteredBindings.map((binding) => (
                                    <Table.Tr key={`hotkey-${binding}`}>
                                        <Table.Td style={{ userSelect: 'none' }}>
                                            {BINDINGS_MAP[binding as keyof typeof BINDINGS_MAP]}
                                        </Table.Td>
                                        <Table.Td>
                                            <TextInput
                                                id={`hotkey-${binding}`}
                                                leftSection={<Icon icon="keyboard" />}
                                                onBlur={() => setSelected(null)}
                                                onChange={() => {}}
                                                onKeyDownCapture={(e) => {
                                                    if (selected !== (binding as BindingActions))
                                                        return;
                                                    handleSetHotkey(binding as BindingActions, e);
                                                }}
                                                readOnly
                                                rightSection={
                                                    <ActionIcon
                                                        icon="edit"
                                                        onClick={() => {
                                                            setSelected(binding as BindingActions);
                                                            document
                                                                .getElementById(`hotkey-${binding}`)
                                                                ?.focus();
                                                        }}
                                                        variant="transparent"
                                                    />
                                                }
                                                style={{
                                                    opacity:
                                                        selected === (binding as BindingActions)
                                                            ? 0.8
                                                            : 1,
                                                    outline: duplicateHotkeyMap.includes(
                                                        bindings[
                                                            binding as keyof typeof BINDINGS_MAP
                                                        ].hotkey!,
                                                    )
                                                        ? '1px dashed red'
                                                        : undefined,
                                                }}
                                                value={
                                                    bindings[binding as keyof typeof BINDINGS_MAP]
                                                        .hotkey
                                                }
                                            />
                                        </Table.Td>
                                        {isElectron() && (
                                            <Table.Td>
                                                <Checkbox
                                                    checked={
                                                        bindings[
                                                            binding as keyof typeof BINDINGS_MAP
                                                        ].isGlobal
                                                    }
                                                    disabled={
                                                        bindings[
                                                            binding as keyof typeof BINDINGS_MAP
                                                        ].hotkey === ''
                                                    }
                                                    onChange={(e) =>
                                                        handleSetGlobalHotkey(
                                                            binding as BindingActions,
                                                            e,
                                                        )
                                                    }
                                                    size="md"
                                                    style={{
                                                        opacity: bindings[
                                                            binding as keyof typeof BINDINGS_MAP
                                                        ].allowGlobal
                                                            ? 1
                                                            : 0,
                                                    }}
                                                />
                                            </Table.Td>
                                        )}
                                        {bindings[binding as keyof typeof BINDINGS_MAP].hotkey && (
                                            <Table.Td>
                                                <ActionIcon
                                                    icon="x"
                                                    iconProps={{
                                                        color: 'error',
                                                    }}
                                                    onClick={() =>
                                                        handleClearHotkey(binding as BindingActions)
                                                    }
                                                    variant="transparent"
                                                />
                                            </Table.Td>
                                        )}
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </div>
                </>
            }
            options={options}
        />
    );
});
