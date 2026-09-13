// HTMLMediaElement.volume throws an IndexSizeError outside [0, 1], so clamp
// the result to guard against unclamped inputs (persisted state, IPC, remote)
export const convertToLogVolume = (linearVolume: number) => {
    const volume = Math.pow(linearVolume, 2.0);

    return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0;
};
