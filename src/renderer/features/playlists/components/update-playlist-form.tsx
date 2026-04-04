import { closeModal, ContextModalProps } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { useDeletePlaylistImage } from '/@/renderer/features/playlists/mutations/delete-playlist-image-mutation';
import { useUpdatePlaylist } from '/@/renderer/features/playlists/mutations/update-playlist-mutation';
import { useUploadPlaylistImage } from '/@/renderer/features/playlists/mutations/upload-playlist-image-mutation';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServer, useCurrentServerId, usePermissions } from '/@/renderer/store';
import { hasFeature } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { toast } from '/@/shared/components/toast/toast';
import { useForm } from '/@/shared/hooks/use-form';
import {
    LibraryItem,
    ServerType,
    SortOrder,
    UpdatePlaylistBody,
    UpdatePlaylistQuery,
    UserListSort,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

type PlaylistImageProps = {
    imageId: null | string;
    imageUrl: null | string;
    uploadedImage?: string;
};

export const UpdatePlaylistContextModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    body: Partial<UpdatePlaylistBody>;
    playlistImage?: PlaylistImageProps;
    query: UpdatePlaylistQuery;
}>) => {
    const { t } = useTranslation();
    const updateMutation = useUpdatePlaylist({});
    const uploadImageMutation = useUploadPlaylistImage({});
    const deleteImageMutation = useDeletePlaylistImage({});
    const server = useCurrentServer();
    const { body, playlistImage, query } = innerProps;

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState<null | string>(null);
    const [removeCustomCover, setRemoveCustomCover] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!pendingFile) {
            setPendingPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(pendingFile);
        setPendingPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingFile]);

    const form = useForm<UpdatePlaylistBody>({
        initialValues: {
            comment: body?.comment || '',
            name: body?.name || '',
            ownerId: body.ownerId,
            public: body.public,
            queryBuilderRules: body.queryBuilderRules,
            sync: body.sync,
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        if (!server?.id) return;

        setIsSaving(true);
        try {
            await updateMutation.mutateAsync({
                apiClientProps: { serverId: server.id },
                body: values,
                query,
            });

            if (pendingFile) {
                const buffer = await pendingFile.arrayBuffer();
                await uploadImageMutation.mutateAsync({
                    apiClientProps: { serverId: server.id },
                    body: { image: new Uint8Array(buffer) },
                    query: { id: query.id },
                });
            } else if (removeCustomCover && playlistImage?.uploadedImage) {
                await deleteImageMutation.mutateAsync({
                    apiClientProps: { serverId: server.id },
                    query: { id: query.id },
                });
            }

            toast.success({
                message: t('form.editPlaylist.success', { postProcess: 'sentenceCase' }),
            });
            closeModal(id);
        } catch (err: any) {
            toast.error({
                message: err?.message,
                title: t('error.genericError', { postProcess: 'sentenceCase' }),
            });
        } finally {
            setIsSaving(false);
        }
    });

    const isPublicDisplayed = hasFeature(server, ServerFeature.PUBLIC_PLAYLIST);
    const isOwnerDisplayed = server?.type === ServerType.NAVIDROME;
    const isCommentDisplayed = server?.type === ServerType.NAVIDROME;
    const isCoverImageDisplayed = hasFeature(server, ServerFeature.PLAYLIST_IMAGE_UPLOAD);
    const isSubmitDisabled = !form.values.name || isSaving;
    const hadUploadedCover = !!playlistImage?.uploadedImage;

    const fieldNodes: ReactNode[] = [
        <TextInput
            data-autofocus
            key="name"
            label={t('form.createPlaylist.input', {
                context: 'name',
                postProcess: 'titleCase',
            })}
            required
            {...form.getInputProps('name')}
        />,
    ];

    if (isCommentDisplayed) {
        fieldNodes.push(
            <Textarea
                autosize
                key="comment"
                label={t('form.createPlaylist.input', {
                    context: 'description',
                    postProcess: 'titleCase',
                })}
                minRows={5}
                {...form.getInputProps('comment')}
            />,
        );
    }

    if (isOwnerDisplayed) {
        fieldNodes.push(<OwnerSelect form={form} key="owner" />);
    }

    if (isPublicDisplayed) {
        if (server?.type === ServerType.JELLYFIN) {
            fieldNodes.push(
                <div key="jellyfin-public-note">
                    {t('form.editPlaylist.publicJellyfinNote', {
                        postProcess: 'sentenceCase',
                    })}
                </div>,
            );
        }
        fieldNodes.push(
            <Switch
                key="public"
                label={t('form.createPlaylist.input', {
                    context: 'public',
                    postProcess: 'titleCase',
                })}
                {...form.getInputProps('public', { type: 'checkbox' })}
            />,
        );
    }

    fieldNodes.push(
        <Group justify="flex-end" key="actions">
            <ModalButton disabled={isSaving} onClick={() => closeModal(id)}>
                {t('common.cancel')}
            </ModalButton>
            <ModalButton
                disabled={isSubmitDisabled}
                loading={isSaving}
                type="submit"
                variant="filled"
            >
                {t('common.save')}
            </ModalButton>
        </Group>,
    );

    return (
        <form onSubmit={handleSubmit}>
            {isCoverImageDisplayed ? (
                <Flex align="flex-start" gap="lg" wrap="wrap">
                    <PlaylistCoverField
                        hadUploadedCover={hadUploadedCover}
                        onClearPending={() => setPendingFile(null)}
                        onFileSelect={(file) => {
                            if (!file) return;
                            setRemoveCustomCover(false);
                            setPendingFile(file);
                        }}
                        onToggleRemoveCover={() => setRemoveCustomCover((v) => !v)}
                        pendingFile={pendingFile}
                        pendingPreviewUrl={pendingPreviewUrl}
                        playlistImage={playlistImage}
                        removeCustomCover={removeCustomCover}
                    />
                    <Stack gap="md" style={{ flex: '1 1 220px', minWidth: 0 }}>
                        {fieldNodes}
                    </Stack>
                </Flex>
            ) : (
                <Stack gap="md">{fieldNodes}</Stack>
            )}
        </form>
    );
};

const COVER_SIZE = 240;

function PlaylistCoverField({
    hadUploadedCover,
    onClearPending,
    onFileSelect,
    onToggleRemoveCover,
    pendingFile,
    pendingPreviewUrl,
    playlistImage,
    removeCustomCover,
}: {
    hadUploadedCover: boolean;
    onClearPending: () => void;
    onFileSelect: (file: File | null) => void;
    onToggleRemoveCover: () => void;
    pendingFile: File | null;
    pendingPreviewUrl: null | string;
    playlistImage?: PlaylistImageProps;
    removeCustomCover: boolean;
}) {
    const server = useCurrentServer();

    const showServerCover = !pendingPreviewUrl && !removeCustomCover;
    const previewId = showServerCover ? playlistImage?.imageId || undefined : undefined;
    const previewSrc = pendingPreviewUrl || (showServerCover ? playlistImage?.imageUrl || '' : '');

    const secondaryAction = () => {
        if (pendingFile) {
            onClearPending();
            return;
        }
        if (hadUploadedCover) {
            onToggleRemoveCover();
        }
    };

    const secondaryDisabled = !pendingFile && !hadUploadedCover;

    const secondaryIcon = pendingFile ? 'x' : removeCustomCover ? 'arrowLeft' : 'delete';

    const iconControls = (
        <>
            <FileButton accept="image/*" onChange={onFileSelect}>
                {(props) => (
                    <ActionIcon
                        icon="uploadImage"
                        iconProps={{ size: 'lg' }}
                        radius="xl"
                        size="sm"
                        variant="default"
                        {...props}
                    />
                )}
            </FileButton>
            <ActionIcon
                disabled={secondaryDisabled}
                icon={secondaryIcon}
                iconProps={{ size: 'lg' }}
                onClick={secondaryAction}
                radius="xl"
                size="sm"
                variant="default"
            />
        </>
    );

    const coverArt = (
        <ItemImage
            enableViewport={false}
            id={previewId}
            itemType={LibraryItem.PLAYLIST}
            serverId={server?.id}
            src={previewSrc}
            type="header"
        />
    );

    return (
        <Box
            style={{
                borderRadius: 'var(--mantine-radius-md)',
                flexShrink: 0,
                height: COVER_SIZE,
                overflow: 'hidden',
                position: 'relative',
                width: COVER_SIZE,
            }}
        >
            {coverArt}
            <Group
                gap={4}
                style={{
                    background: 'rgba(0, 0, 0, 0.55)',
                    borderRadius: 'var(--mantine-radius-md)',
                    bottom: 6,
                    padding: 4,
                    position: 'absolute',
                    right: 6,
                }}
                wrap="nowrap"
            >
                {iconControls}
            </Group>
        </Box>
    );
}

const OwnerSelect = ({ form }: { form: ReturnType<typeof useForm<UpdatePlaylistBody>> }) => {
    const serverId = useCurrentServerId();
    const permissions = usePermissions();

    const usersQuery = useQuery(
        sharedQueries.users({
            options: { enabled: permissions.playlists.editOwner },
            query: { sortBy: UserListSort.NAME, sortOrder: SortOrder.ASC, startIndex: 0 },
            serverId,
        }),
    );

    const userList = usersQuery.data?.items?.map((user) => ({
        label: user.name,
        value: user.id,
    }));

    if (!permissions.playlists.editOwner) {
        return null;
    }

    return (
        <Select
            data={usersQuery.isLoading ? [] : userList}
            disabled={usersQuery.isLoading}
            {...form.getInputProps('ownerId')}
            label={t('form.createPlaylist.input', {
                context: 'owner',
                postProcess: 'titleCase',
            })}
        />
    );
};
