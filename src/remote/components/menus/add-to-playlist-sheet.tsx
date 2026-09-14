import { useState } from 'react';

import { ActionSheet } from '/@/remote/components/action-sheet';
import { useRemoteQuery } from '/@/remote/hooks/use-remote-query';
import { usePlaylistsResponse } from '/@/remote/store/library';
import { Button } from '/@/shared/components/button/button';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { RemotePlaylistItem } from '/@/shared/types/remote-types';

interface AddToPlaylistSheetProps {
    disabled?: boolean;
    onSelect: (playlistId: string, playlistName: string) => void;
    pendingPlaylistId?: null | string;
}

export const AddToPlaylistSheet = ({
    disabled,
    onSelect,
    pendingPlaylistId,
}: AddToPlaylistSheetProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const response = usePlaylistsResponse();

    const { hasMore, items, loadMore } = useRemoteQuery<RemotePlaylistItem>({
        event: 'playlists-request',
        response,
        searchTerm: debouncedSearchTerm || undefined,
    });

    return (
        <Stack gap={4} px={8}>
            <TextInput
                autoFocus
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                placeholder="Search playlists…"
                value={searchTerm}
            />
            {items.length === 0 && (
                <Text isMuted py="md" ta="center">
                    No playlists found
                </Text>
            )}
            {items.map((playlist) => (
                <ActionSheet.Item
                    disabled={disabled}
                    key={playlist.id}
                    leftIcon="playlist"
                    loading={pendingPlaylistId === playlist.id}
                    onClick={() => onSelect(playlist.id, playlist.name)}
                >
                    {playlist.name}
                </ActionSheet.Item>
            ))}
            {hasMore && (
                <Button disabled={disabled} onClick={loadMore} variant="default">
                    Load more
                </Button>
            )}
        </Stack>
    );
};
