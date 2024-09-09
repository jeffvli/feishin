import { ActionIcon, CopyButton, Group } from '@mantine/core';
import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';
import { RiCheckFill, RiClipboardFill, RiExternalLinkFill } from 'react-icons/ri';
import { Tooltip, toast } from '/@/renderer/components';
import styled from 'styled-components';

const util = isElectron() ? window.electron.utils : null;

export type SongPathProps = {
    path: string | null;
};

const PathText = styled.div`
    user-select: all;
`;

export const SongPath = ({ path }: SongPathProps) => {
    const { t } = useTranslation();

    if (!path) return null;

    return (
        <Group>
            <CopyButton
                timeout={2000}
                value={path}
            >
                {({ copied, copy }) => (
                    <Tooltip
                        withinPortal
                        label={t(
                            copied ? 'page.itemDetail.copiedPath' : 'page.itemDetail.copyPath',
                            { postProcess: 'sentenceCase' },
                        )}
                    >
                        <ActionIcon onClick={copy}>
                            {copied ? <RiCheckFill /> : <RiClipboardFill />}
                        </ActionIcon>
                    </Tooltip>
                )}
            </CopyButton>
            {util && (
                <Tooltip
                    withinPortal
                    label={t('page.itemDetail.openFile', { postProcess: 'sentenceCase' })}
                >
                    <ActionIcon>
                        <RiExternalLinkFill
                            onClick={() => {
                                util.openItem(path).catch((error) => {
                                    toast.error({
                                        message: (error as Error).message,
                                        title: t('error.openError', {
                                            postProcess: 'sentenceCase',
                                        }),
                                    });
                                });
                            }}
                        />
                    </ActionIcon>
                </Tooltip>
            )}
            <PathText>{path}</PathText>
        </Group>
    );
};
