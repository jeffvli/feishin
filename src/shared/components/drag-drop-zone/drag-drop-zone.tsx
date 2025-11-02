import { t } from 'i18next';
import { useCallback, useRef, useState } from 'react';

import { Flex } from '/@/shared/components/flex/flex';
import { AppIcon, Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

interface DragDropZoneProps {
    icon: keyof typeof AppIcon;
    onItemSelected: (contents: string) => void;
    validateItem?: (contents: string) => { error?: string; isValid: boolean };
}

export const DragDropZone = ({ icon, onItemSelected, validateItem }: DragDropZoneProps) => {
    const zoneFileInput = useRef<HTMLInputElement | null>();
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
        (event: React.DragEvent<HTMLDivElement>) => {
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

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.stopPropagation();
        event.preventDefault();
    }, []);

    const onZoneClick = useCallback(() => {
        zoneFileInput.current?.click();
    }, []);

    const onZoneInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
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
                ref={(self) => (zoneFileInput.current = self)}
                style={{ display: 'none' }}
                type="file"
            />
        </Flex>
    );
};
