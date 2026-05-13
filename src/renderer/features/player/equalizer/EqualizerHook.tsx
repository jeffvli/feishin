import { useEqualizerModalStore } from './equalizer-modal.store';
import { EqualizerModal } from './EqualizerModal';
import { MpvEqualizerHook } from './MpvEqualizerHook';
import { WebEqualizerHook } from './WebEqualizerHook';

export const EqualizerHook = () => {
    const isOpen = useEqualizerModalStore((s) => s.isOpen);
    const close = useEqualizerModalStore((s) => s.close);
    return (
        <>
            <MpvEqualizerHook />
            <WebEqualizerHook />
            <EqualizerModal isOpen={isOpen} onClose={close} />
        </>
    );
};
