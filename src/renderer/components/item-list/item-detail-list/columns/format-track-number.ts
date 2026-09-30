interface TrackNumberMetadata {
    discNumber?: null | number;
    trackNumber?: null | number;
}

export const formatTrackNumber = ({ discNumber, trackNumber }: TrackNumberMetadata) => {
    if (typeof trackNumber !== 'number' || !Number.isFinite(trackNumber)) {
        return '—';
    }

    const disc = typeof discNumber === 'number' && Number.isFinite(discNumber) ? discNumber : 1;
    const track = trackNumber.toString().padStart(2, '0');

    return `${disc}-${track}`;
};
