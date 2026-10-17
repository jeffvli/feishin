import { del, get, set } from 'idb-keyval';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { Button } from '/@/shared/components/button/button';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Group } from '/@/shared/components/group/group';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { toast } from '/@/shared/components/toast/toast';

// Your own picture or GIF behind the Home page. It's kept on this computer (in the app's storage, so
// big GIFs fit) and never uploaded anywhere.
const KEY = 'sour-home-background';
const useVersion = create<{ n: number }>(() => ({ n: 0 }));

export const HomeBackground = () => {
    const on = useSourStore((s) => s.look.homeBackground && !s.look.simple);
    const dim = useSourStore((s) => s.look.homeBackgroundDim ?? 45);
    const version = useVersion((s) => s.n);
    const [src, setSrc] = useState<null | string>(null);
    useEffect(() => {
        if (!on) {
            setSrc(null);
            return undefined;
        }
        let url: null | string = null;
        let cancelled = false;
        get(KEY)
            .then((blob) => {
                if (cancelled || !(blob instanceof Blob)) return;
                url = URL.createObjectURL(blob);
                setSrc(url);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [on, version]);
    if (!src) return null;
    return (
        <div
            aria-hidden
            style={{
                backgroundImage: `linear-gradient(rgb(0 0 0 / ${dim}%), rgb(0 0 0 / ${dim}%)), url("${src}")`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                inset: 0,
                pointerEvents: 'none',
                position: 'absolute',
                zIndex: -1,
            }}
        />
    );
};

// Settings > Sour Player: pick, remove and dim the Home background
export const HomeBackgroundSetting = () => {
    const on = useSourStore((s) => s.look.homeBackground);
    const dim = useSourStore((s) => s.look.homeBackgroundDim ?? 45);
    const setLook = useSourStore((s) => s.setLook);
    const pick = async (file: File | null) => {
        if (!file) return;
        if (!/^image\//.test(file.type)) {
            toast.error({ message: 'Pick a picture or a GIF' });
            return;
        }
        if (file.size > 60_000_000) {
            toast.error({ message: 'That file is over 60 MB' });
            return;
        }
        try {
            await set(KEY, file);
            setLook({ homeBackground: true });
            useVersion.setState((s) => ({ n: s.n + 1 }));
        } catch {
            toast.error({ message: "Couldn't save that picture" });
        }
    };
    return (
        <Stack gap={6} w={260}>
            <Group gap="xs" justify="flex-end">
                <FileButton accept="image/*" onChange={pick}>
                    {(props) => (
                        <Button {...props} size="compact-sm" variant="default">
                            {on ? 'Change' : 'Choose picture or GIF'}
                        </Button>
                    )}
                </FileButton>
                {on && (
                    <Button
                        onClick={() => {
                            del(KEY).catch(() => {});
                            setLook({ homeBackground: false });
                        }}
                        size="compact-sm"
                        variant="subtle"
                    >
                        Remove
                    </Button>
                )}
            </Group>
            {on && (
                <Slider
                    label={(v) => `${v}% darker`}
                    max={85}
                    min={0}
                    onChange={(v) => setLook({ homeBackgroundDim: v })}
                    value={dim}
                />
            )}
        </Stack>
    );
};
