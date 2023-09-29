import type { ICellRendererParams } from '@ag-grid-community/core';
import { Skeleton } from '/@/renderer/components/skeleton';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useMemo } from 'react';
import { Text } from '/@/renderer/components/text';

const URL_REGEX =
    /((?:https?:\/\/)?(?:[\w-]{1,32}(?:\.[\w-]{1,32})+)(?:\/[\w\-./?%&=][^.|^\s]*)?)/g;

const replaceURLWithHTMLLinks = (text: string) => {
    const urlRegex = new RegExp(URL_REGEX, 'g');
    return text.replaceAll(
        urlRegex,
        (url) => `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`,
    );
};

export const NoteCell = ({ value }: ICellRendererParams) => {
    const formattedValue = useMemo(() => {
        if (!value) {
            return '';
        }

        return replaceURLWithHTMLLinks(value);
    }, [value]);

    if (value === undefined) {
        return (
            <CellContainer $position="left">
                <Skeleton
                    height="1rem"
                    width="80%"
                />
            </CellContainer>
        );
    }

    return (
        <CellContainer $position="left">
            <Text
                $secondary
                dangerouslySetInnerHTML={{ __html: formattedValue }}
                overflow="hidden"
            />
        </CellContainer>
    );
};
