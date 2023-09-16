import { useCallback, useMemo, useState, KeyboardEvent, ChangeEvent } from 'react';
import { Group } from '@mantine/core';
import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import { RiDeleteBinLine, RiEditLine, RiKeyboardBoxLine } from 'react-icons/ri';
import styled from 'styled-components';
import { Button, TextInput, Checkbox } from '/@/renderer/components';
import { BindingActions, useHotkeySettings, useSettingsStoreActions } from '/@/renderer/store';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';

const ipc = isElectron() ? window.electron.ipc : null;

const BINDINGS_MAP: Record<BindingActions, string> = {
    globalSearch: 'Global search',
    localSearch: 'In-page search',
    next: 'Next track',
    pause: 'Pause',
    play: 'Play',
    playPause: 'Play / Pause',
    previous: 'Previous track',
    skipBackward: 'Skip backward',
    skipForward: 'Skip forward',
    stop: 'Stop',
    toggleFullscreenPlayer: 'Toggle fullscreen player',
    toggleQueue: 'Toggle queue',
    toggleRepeat: 'Toggle repeat',
    toggleShuffle: 'Toggle shuffle',
    volumeDown: 'Volume down',
    volumeMute: 'Volume mute',
    volumeUp: 'Volume up',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
};

const HotkeysContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
    width: 100%;

    button {
        padding: 0 1rem;
    }
`;

export const HotkeyManagerSettings = () => {
    const { bindings, globalMediaHotkeys } = useHotkeySettings();
    const { setSettings } = useSettingsStoreActions();
    const [selected, setSelected] = useState<BindingActions | null>(null);

    const debouncedSetHotkey = debounce(
        (binding: BindingActions, e: KeyboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const IGNORED_KEYS = ['Control', 'Alt', 'Shift', 'Meta', ' ', 'Escape'];
            const keys = [];
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
                    globalMediaHotkeys,
                },
            });

            ipc?.send('set-global-shortcuts', updatedBindings);
        },
        20,
    );

    const handleSetHotkey = useCallback(debouncedSetHotkey, [
        bindings,
        globalMediaHotkeys,
        setSettings,
        debouncedSetHotkey,
    ]);

    const handleSetGlobalHotkey = useCallback(
        (binding: BindingActions, e: ChangeEvent<HTMLInputElement>) => {
            const updatedBindings = {
                ...bindings,
                [binding]: { ...bindings[binding], isGlobal: e.currentTarget.checked },
            };

            setSettings({
                hotkeys: {
                    bindings: updatedBindings,
                    globalMediaHotkeys,
                },
            });

            ipc?.send('set-global-shortcuts', updatedBindings);
        },
        [bindings, globalMediaHotkeys, setSettings],
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
                    globalMediaHotkeys,
                },
            });

            ipc?.send('set-global-shortcuts', updatedBindings);
        },
        [bindings, globalMediaHotkeys, setSettings],
    );

    const duplicateHotkeyMap = useMemo(() => {
        const countPerHotkey = Object.values(bindings).reduce((acc, key) => {
            const hotkey = key.hotkey;
            if (!hotkey) return acc;

            if (acc[hotkey]) {
                acc[hotkey] += 1;
            } else {
                acc[hotkey] = 1;
            }

            return acc;
        }, {} as Record<string, number>);

        const duplicateKeys = Object.keys(countPerHotkey).filter((key) => countPerHotkey[key] > 1);

        return duplicateKeys;
    }, [bindings]);

    return (
        <>
            <SettingsOptions
                control={<></>}
                description="Configure application hotkeys. Toggle the checkbox to set as a global hotkey (desktop only)"
                title="Application hotkeys"
            />
            <HotkeysContainer>
                {Object.keys(bindings)
                    .filter((binding) => BINDINGS_MAP[binding as keyof typeof BINDINGS_MAP])
                    .map((binding) => (
                        <Group
                            key={`hotkey-${binding}`}
                            noWrap
                        >
                            <TextInput
                                readOnly
                                style={{ userSelect: 'none' }}
                                value={BINDINGS_MAP[binding as keyof typeof BINDINGS_MAP]}
                            />
                            <TextInput
                                readOnly
                                icon={<RiKeyboardBoxLine />}
                                id={`hotkey-${binding}`}
                                style={{
                                    opacity: selected === (binding as BindingActions) ? 0.8 : 1,
                                    outline: duplicateHotkeyMap.includes(
                                        bindings[binding as keyof typeof BINDINGS_MAP].hotkey!,
                                    )
                                        ? '1px dashed red'
                                        : undefined,
                                }}
                                value={bindings[binding as keyof typeof BINDINGS_MAP].hotkey}
                                onBlur={() => setSelected(null)}
                                onChange={() => {}}
                                onKeyDownCapture={(e) => {
                                    if (selected !== (binding as BindingActions)) return;
                                    handleSetHotkey(binding as BindingActions, e);
                                }}
                            />
                            {isElectron() && (
                                <Checkbox
                                    checked={
                                        bindings[binding as keyof typeof BINDINGS_MAP].isGlobal
                                    }
                                    disabled={
                                        bindings[binding as keyof typeof BINDINGS_MAP].hotkey === ''
                                    }
                                    size="xl"
                                    style={{
                                        opacity: bindings[binding as keyof typeof BINDINGS_MAP]
                                            .allowGlobal
                                            ? 1
                                            : 0,
                                    }}
                                    onChange={(e) =>
                                        handleSetGlobalHotkey(binding as BindingActions, e)
                                    }
                                />
                            )}
                            <Button
                                variant="default"
                                w={100}
                                onClick={() => {
                                    setSelected(binding as BindingActions);
                                    document.getElementById(`hotkey-${binding}`)?.focus();
                                }}
                            >
                                <RiEditLine />
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => handleClearHotkey(binding as BindingActions)}
                            >
                                <RiDeleteBinLine />
                            </Button>
                        </Group>
                    ))}
            </HotkeysContainer>
        </>
    );
};
