import { t } from 'i18next';
import { MouseEvent, type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { useDeleteInternetRadioStationImage } from '/@/renderer/features/radio/mutations/delete-internet-radio-station-image-mutation';
import { useUpdateRadioStation } from '/@/renderer/features/radio/mutations/update-radio-station-mutation';
import { useUploadInternetRadioStationImage } from '/@/renderer/features/radio/mutations/upload-internet-radio-station-image-mutation';
import { useCurrentServer } from '/@/renderer/store';
import { logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { hasFeature } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Box } from '/@/shared/components/box/box';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { closeAllModals, openModal } from '/@/shared/components/modal/modal';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { useForm } from '/@/shared/hooks/use-form';
import {
    InternetRadioStation,
    LibraryItem,
    ServerListItem,
    UpdateInternetRadioStationBody,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

interface EditRadioStationFormProps {
    onCancel: () => void;
    station: InternetRadioStation;
}

type RadioStationImageProps = {
    imageId: null | string;
    imageUrl: null | string;
    uploadedImage?: string;
};

export const EditRadioStationForm = ({ onCancel, station }: EditRadioStationFormProps) => {
    const { t } = useTranslation();
    const updateMutation = useUpdateRadioStation({});
    const uploadImageMutation = useUploadInternetRadioStationImage({});
    const deleteImageMutation = useDeleteInternetRadioStationImage({});
    const server = useCurrentServer();
    const isCoverImageDisplayed = hasFeature(server, ServerFeature.INTERNET_RADIO_IMAGE_UPLOAD);

    const stationImage: RadioStationImageProps = {
        imageId: station.imageId ?? null,
        imageUrl: station.imageUrl ?? null,
        uploadedImage: station.uploadedImage ?? undefined,
    };

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

    const form = useForm<UpdateInternetRadioStationBody>({
        initialValues: {
            homepageUrl: station.homepageUrl || '',
            name: station.name,
            streamUrl: station.streamUrl,
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        if (!server?.id) return;

        setIsSaving(true);
        try {
            await updateMutation.mutateAsync({
                apiClientProps: { serverId: server.id },
                body: values,
                query: { id: station.id },
            });

            if (pendingFile) {
                const buffer = await pendingFile.arrayBuffer();
                await uploadImageMutation.mutateAsync({
                    apiClientProps: { serverId: server.id },
                    body: { image: new Uint8Array(buffer) },
                    query: { id: station.id },
                });
            } else if (removeCustomCover && stationImage.uploadedImage) {
                await deleteImageMutation.mutateAsync({
                    apiClientProps: { serverId: server.id },
                    query: { id: station.id },
                });
            }

            toast.success({
                message: t('form.editRadioStation.success', {
                    postProcess: 'sentenceCase',
                }) as string,
            });
            closeAllModals();
        } catch (err: unknown) {
            logFn.error(logMsg.other.error, {
                meta: { error: err as Error },
            });

            toast.error({
                message: (err as Error)?.message,
                title: t('error.genericError', { postProcess: 'sentenceCase' }) as string,
            });
        } finally {
            setIsSaving(false);
        }
    });

    const isSubmitDisabled = !form.values.name || !form.values.streamUrl || isSaving;
    const hadUploadedCover = !!stationImage.uploadedImage;

    const fieldNodes: ReactNode[] = [
        <TextInput
            data-autofocus
            key="name"
            label={t('form.createRadioStation.input', {
                context: 'name',
                postProcess: 'titleCase',
            })}
            required
            {...form.getInputProps('name')}
        />,
        <TextInput
            key="streamUrl"
            label={t('form.createRadioStation.input', {
                context: 'streamUrl',
                postProcess: 'titleCase',
            })}
            required
            {...form.getInputProps('streamUrl')}
        />,
        <TextInput
            key="homepageUrl"
            label={t('form.createRadioStation.input', {
                context: 'homepageUrl',
                postProcess: 'titleCase',
            })}
            {...form.getInputProps('homepageUrl')}
        />,
        <Group justify="flex-end" key="actions">
            <ModalButton disabled={isSaving} onClick={onCancel}>
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
    ];

    return (
        <form onSubmit={handleSubmit}>
            {isCoverImageDisplayed && server?.id ? (
                <Flex align="flex-start" gap="lg" wrap="wrap">
                    <RadioStationCoverField
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
                        removeCustomCover={removeCustomCover}
                        stationImage={stationImage}
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

function RadioStationCoverField({
    hadUploadedCover,
    onClearPending,
    onFileSelect,
    onToggleRemoveCover,
    pendingFile,
    pendingPreviewUrl,
    removeCustomCover,
    stationImage,
}: {
    hadUploadedCover: boolean;
    onClearPending: () => void;
    onFileSelect: (file: File | null) => void;
    onToggleRemoveCover: () => void;
    pendingFile: File | null;
    pendingPreviewUrl: null | string;
    removeCustomCover: boolean;
    stationImage: RadioStationImageProps;
}) {
    const server = useCurrentServer();

    const showServerCover = !pendingPreviewUrl && !removeCustomCover;
    const previewId = showServerCover ? stationImage.imageId || undefined : undefined;
    const previewSrc = pendingPreviewUrl || (showServerCover ? stationImage.imageUrl || '' : '');

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
            itemType={LibraryItem.RADIO_STATION}
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

export const openEditRadioStationModal = (
    station: InternetRadioStation,
    server: null | ServerListItem,
    e?: MouseEvent<HTMLButtonElement>,
) => {
    e?.stopPropagation();

    if (!server) {
        toast.error({
            message: t('common.error.noServer', { postProcess: 'sentenceCase' }) as string,
        });
        return;
    }

    const hasImageUpload = hasFeature(server, ServerFeature.INTERNET_RADIO_IMAGE_UPLOAD);

    openModal({
        children: <EditRadioStationForm onCancel={closeAllModals} station={station} />,
        size: hasImageUpload ? 'lg' : 'md',
        title: t('common.edit', { postProcess: 'titleCase' }) as string,
    });
};
