import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useCurrentServerId, useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Code } from '/@/shared/components/code/code';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { Played } from '/@/shared/types/domain-types';

export const PathSettings = memo(() => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();
    const randomSong = useQuery({
        ...songsQueries.random({
            query: { limit: 1, played: Played.All },
            serverId,
        }),
        gcTime: Infinity,
        staleTime: Infinity,
    });

    const { pathReplace, pathReplaceWith } = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const [localPathReplace, setLocalPathReplace] = useState(pathReplace);
    const [localPathReplaceWith, setLocalPathReplaceWith] = useState(pathReplaceWith);

    useEffect(() => {
        setLocalPathReplace(pathReplace);
    }, [pathReplace]);

    useEffect(() => {
        setLocalPathReplaceWith(pathReplaceWith);
    }, [pathReplaceWith]);

    const debouncedSetPathReplace = useDebouncedCallback((value: string) => {
        setSettings({
            general: {
                pathReplace: value,
            },
        });

        randomSong.refetch();
    }, 500);

    const debouncedSetPathReplaceWith = useDebouncedCallback((value: string) => {
        setSettings({
            general: {
                pathReplaceWith: value,
            },
        });

        randomSong.refetch();
    }, 500);

    return (
        <Stack>
            <Group>
                <Text>{t('setting.pathReplace', { postProcess: 'sentenceCase' })}</Text>
                <ActionIcon
                    icon="refresh"
                    loading={randomSong.isFetching}
                    onClick={() => randomSong.refetch()}
                    size="xs"
                    variant="transparent"
                />
            </Group>
            <Code>
                <Text isMuted size="md">
                    {randomSong.data?.items[0]?.path || ''}
                </Text>
            </Code>
            <Group grow>
                <TextInput
                    onChange={(e) => {
                        const value = e.currentTarget.value;
                        setLocalPathReplace(value);
                        debouncedSetPathReplace(value);
                    }}
                    placeholder={t('setting.pathReplace_optionRemovePrefix', {
                        postProcess: 'sentenceCase',
                    })}
                    value={localPathReplace}
                />
                <TextInput
                    onChange={(e) => {
                        const value = e.currentTarget.value;
                        setLocalPathReplaceWith(value);
                        debouncedSetPathReplaceWith(value);
                    }}
                    placeholder={t('setting.pathReplace_optionAddPrefix', {
                        postProcess: 'sentenceCase',
                    })}
                    value={localPathReplaceWith}
                />
            </Group>
        </Stack>
    );
});
