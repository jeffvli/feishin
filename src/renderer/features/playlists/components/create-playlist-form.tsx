import { t } from 'i18next';
import { MouseEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    PlaylistQueryBuilder,
    PlaylistQueryBuilderRef,
} from '/@/renderer/features/playlists/components/playlist-query-builder';
import { useCreatePlaylist } from '/@/renderer/features/playlists/mutations/create-playlist-mutation';
import { convertQueryGroupToNDQuery } from '/@/renderer/features/playlists/utils';
import { useCurrentServer } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { Group } from '/@/shared/components/group/group';
import { closeAllModals, openModal } from '/@/shared/components/modal/modal';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';
import { useForm } from '/@/shared/hooks/use-form';
import {
    CreatePlaylistBody,
    ServerListItem,
    ServerType,
    SongListSort,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

interface CreatePlaylistFormProps {
    onCancel: () => void;
}

export const CreatePlaylistForm = ({ onCancel }: CreatePlaylistFormProps) => {
    const { t } = useTranslation();
    const mutation = useCreatePlaylist({});
    const server = useCurrentServer();
    const queryBuilderRef = useRef<PlaylistQueryBuilderRef>(null);

    const form = useForm<CreatePlaylistBody>({
        initialValues: {
            comment: '',
            name: '',
            queryBuilderRules: undefined,
        },
    });
    const [isSmartPlaylist, setIsSmartPlaylist] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    const handleSubmit = form.onSubmit((values) => {
        if (!server) return;

        // If creating a smart playlist and we're on the first step, advance to step 2
        // to configure the query instead of submitting immediately.
        if (isSmartPlaylist && step === 1) {
            setStep(2);
            return;
        }

        const smartPlaylist = queryBuilderRef.current?.getFilters();

        // New syntax: sortBy is now a single string with comma-separated fields and +/- prefix
        // e.g., "+album,-year" means sort by album ascending, then year descending
        const sortValue =
            isSmartPlaylist && smartPlaylist?.extraFilters?.sortBy?.[0]
                ? smartPlaylist.extraFilters.sortBy[0]
                : undefined;

        const rules =
            isSmartPlaylist && smartPlaylist?.filters
                ? {
                      ...convertQueryGroupToNDQuery(smartPlaylist.filters),
                      limit: smartPlaylist.extraFilters.limit,
                      // order field is now optional - sort direction is embedded in sort field
                      sort: sortValue || '+dateAdded',
                  }
                : undefined;

        mutation.mutate(
            {
                apiClientProps: { serverId: server.id },
                body: {
                    ...values,
                    ...(rules ? { queryBuilderRules: rules } : {}),
                },
            },
            {
                onError: (err) => {
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: () => {
                    toast.success({
                        message: t('form.createPlaylist.success', { postProcess: 'sentenceCase' }),
                    });
                    onCancel();
                },
            },
        );
    });

    const isPublicDisplayed = hasFeature(server, ServerFeature.PUBLIC_PLAYLIST);
    const isSubmitDisabled = !form.values.name || mutation.isPending;

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                {step === 1 && (
                    <>
                        <TextInput
                            data-autofocus
                            label={t('form.createPlaylist.input', {
                                context: 'name',
                                postProcess: 'titleCase',
                            })}
                            required
                            {...form.getInputProps('name')}
                        />
                        {server?.type === ServerType.NAVIDROME && (
                            <Textarea
                                autosize
                                label={t('form.createPlaylist.input', {
                                    context: 'description',
                                    postProcess: 'titleCase',
                                })}
                                minRows={5}
                                {...form.getInputProps('comment')}
                            />
                        )}
                        <Group>
                            {isPublicDisplayed && (
                                <Switch
                                    label={t('form.createPlaylist.input', {
                                        context: 'public',
                                        postProcess: 'titleCase',
                                    })}
                                    {...form.getInputProps('public', {
                                        type: 'checkbox',
                                    })}
                                />
                            )}
                            {server?.type === ServerType.NAVIDROME &&
                                hasFeature(server, ServerFeature.PLAYLISTS_SMART) && (
                                    <Switch
                                        checked={isSmartPlaylist}
                                        label="Is smart playlist?"
                                        onChange={(e) => {
                                            const next = e.currentTarget.checked;
                                            setIsSmartPlaylist(next);
                                            if (!next) {
                                                setStep(1);
                                            }
                                        }}
                                    />
                                )}
                        </Group>
                    </>
                )}

                {isSmartPlaylist && step === 2 && (
                    <Stack pt="1rem">
                        <Text>Query Editor</Text>
                        <PlaylistQueryBuilder
                            limit={undefined}
                            query={undefined}
                            ref={queryBuilderRef}
                            sortBy={[SongListSort.ALBUM]}
                            sortOrder="asc"
                        />
                    </Stack>
                )}

                <Group justify="flex-end">
                    {isSmartPlaylist && step === 2 && (
                        <ModalButton onClick={() => setStep(1)} px="2xl" uppercase variant="subtle">
                            Back
                        </ModalButton>
                    )}
                    <ModalButton onClick={onCancel} px="2xl" uppercase variant="subtle">
                        {t('common.cancel')}
                    </ModalButton>
                    <ModalButton
                        disabled={isSubmitDisabled}
                        loading={mutation.isPending}
                        type="submit"
                        variant="filled"
                    >
                        {isSmartPlaylist && step === 1
                            ? t('common.confirm', { postProcess: 'sentenceCase' })
                            : t('common.create')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};

export const openCreatePlaylistModal = (
    server?: ServerListItem,
    e?: MouseEvent<HTMLButtonElement>,
) => {
    e?.stopPropagation();

    openModal({
        children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
        size: server?.type === ServerType?.NAVIDROME ? 'xl' : 'sm',
        title: t('form.createPlaylist.title', { postProcess: 'titleCase' }),
    });
};
