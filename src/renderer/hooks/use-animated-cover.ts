import { useEffect, useState } from 'react';

import { getAnimatedCoverUrl } from '/@/renderer/api/animated-covers-api';
import { useAnimatedCoversSettings } from '/@/renderer/store/settings.store';

interface UseAnimatedCoverProps {
    albumName?: string;
    artistName?: string;
    enabled?: boolean;
}

export const useAnimatedCover = ({
    albumName,
    artistName,
    enabled = true,
}: UseAnimatedCoverProps) => {
    const [animatedCoverUrl, setAnimatedCoverUrl] = useState<null | string>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { apiBase } = useAnimatedCoversSettings();

    useEffect(() => {
        if (!enabled || !albumName || !artistName) {
            setAnimatedCoverUrl(null);
            return;
        }

        const fetchAnimatedCover = async () => {
            setIsLoading(true);

            const url = await getAnimatedCoverUrl(albumName, artistName, apiBase);

            setAnimatedCoverUrl(url);
            setIsLoading(false);
        };

        fetchAnimatedCover();
    }, [albumName, artistName, apiBase, enabled]);

    return {
        animatedCoverUrl,
        isLoading,
    };
};
