import type { ChangeEvent, DragEvent, HTMLAttributes, ReactNode } from 'react';

import clsx from 'clsx';
import { t } from 'i18next';
import { useCallback, useRef, useState } from 'react';

import styles from './drag-drop-zone.module.css';

import { Flex } from '/@/shared/components/flex/flex';
import { AppIcon, Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { isNativeFileDrag, pickFirstImageFile } from '/@/shared/utils/image-drop';

export interface DragDropZoneFileProps extends DivProps {
    accept?: string;
    children: ReactNode;
    mode: 'file';
    onFileSelected: (file: File) => Promise<void> | void;
}

export type DragDropZoneProps = DragDropZoneFileProps | DragDropZoneTextProps;

type DivProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    'children' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop'
>;

interface DragDropZoneTextProps {
    icon: keyof typeof AppIcon;
    mode?: 'text';
    onItemSelected: (contents: string) => void;
    validateItem?: (contents: string) => { error?: string; isValid: boolean };
}

const DragDropZoneText = ({ icon, onItemSelected, validateItem }: DragDropZoneTextProps) => {
    const zoneFileInput = useRef<HTMLInputElement | null>(null);
    const [error, setError] = useState<string>('');

    const processItem = useCallback(
        (itemContents: string) => {
            const { error: validationError, isValid } = validateItem
                ? validateItem(itemContents)
                : { isValid: true };

            if (validationError || !isValid) {
                setError(validationError!);
                return;
            }

            onItemSelected(itemContents);
        },
        [onItemSelected, validateItem],
    );

    const onItemDropped = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();

            const items = event.dataTransfer.items;

            if (items.length > 1) {
                setError(t('dragDropZone.error_oneFileOnly'));
                return;
            }

            const file = items[0].getAsFile();

            if (!file) {
                return;
            }

            file.text()
                .then((value) => processItem(value.toString()))
                .catch((err) => {
                    const error = err as Error;
                    setError(
                        t('dragDropZone.error_readingFile', {
                            errorMessage: error.message,
                        }),
                    );
                });
        },
        [processItem],
    );

    const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.stopPropagation();
        event.preventDefault();
    }, []);

    const onZoneClick = useCallback(() => {
        zoneFileInput.current?.click();
    }, []);

    const onZoneInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const { files } = event.target;

            if (!files || files.length > 1) {
                setError(t('dragDropZone.error_oneFileOnly'));
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                const contents = event.target?.result;

                if (!contents) {
                    return;
                }

                processItem(contents.toString());
            });

            reader.readAsText(files[0]);
        },
        [processItem],
    );

    const hasErrored = error.length > 0;
    const borderColour = hasErrored ? 'red' : 'grey';

    return (
        <Flex
            align="center"
            bd={`2px dashed ${borderColour}`}
            bdrs={'sm'}
            direction="column"
            gap={'sm'}
            justify="center"
            onClick={onZoneClick}
            onDragOver={onDragOver}
            onDrop={onItemDropped}
            p="sm"
            style={{ cursor: 'pointer' }}
        >
            <Icon icon={icon} size="3xl" />
            <Text>{t('dragDropZone.mainText').toString()}</Text>
            {hasErrored ? (
                <Text c="red" ta="center">
                    {error}
                </Text>
            ) : null}
            <input
                onChange={onZoneInputChange}
                ref={(self) => {
                    zoneFileInput.current = self;
                }}
                style={{ display: 'none' }}
                type="file"
            />
        </Flex>
    );
};

const DragDropZoneFile = (props: DragDropZoneFileProps) => {
    const { accept = 'image/*', children, className, mode, onFileSelected, ...divProps } = props;
    void mode;
    const fileDragDepth = useRef(0);
    const [fileDragOver, setFileDragOver] = useState(false);

    const resolveFile = useCallback(
        (dataTransfer: DataTransfer): File | null => {
            if (accept === 'image/*') {
                return pickFirstImageFile(dataTransfer.files);
            }
            const first = dataTransfer.files?.item(0);
            return first ?? null;
        },
        [accept],
    );

    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!isNativeFileDrag(e)) return;
        e.preventDefault();
        e.stopPropagation();
        fileDragDepth.current += 1;
        setFileDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!isNativeFileDrag(e)) return;
        e.preventDefault();
        e.stopPropagation();
        fileDragDepth.current -= 1;
        if (fileDragDepth.current <= 0) {
            fileDragDepth.current = 0;
            setFileDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!isNativeFileDrag(e)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            if (!isNativeFileDrag(e)) return;
            e.preventDefault();
            e.stopPropagation();
            fileDragDepth.current = 0;
            setFileDragOver(false);
            const file = resolveFile(e.dataTransfer);
            if (file) void onFileSelected(file);
        },
        [onFileSelected, resolveFile],
    );

    return (
        <div
            {...divProps}
            className={clsx(className, {
                [styles.fileTargetDragOver]: fileDragOver,
            })}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}
        </div>
    );
};

export const DragDropZone = (props: DragDropZoneProps) => {
    if (props.mode === 'file') {
        return <DragDropZoneFile {...props} />;
    }

    return <DragDropZoneText {...props} />;
};
