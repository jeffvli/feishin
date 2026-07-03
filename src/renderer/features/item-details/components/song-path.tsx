import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import { useResolvedSongPath } from '/@/renderer/utils/resolve-song-path';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { CopyButton } from '/@/shared/components/copy-button/copy-button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

const util = isElectron() ? window.api.utils : null;

export type SongPathProps = {
    path: null | string;
};

export const SongPath = ({ path }: SongPathProps) => {
    const { t } = useTranslation();
    const resolvedPath = useResolvedSongPath(path);

    if (!resolvedPath) return null;

    return (
        <Group>
            <CopyButton timeout={2000} value={resolvedPath}>
                {({ copied, copy }) => (
                    <Tooltip
                        label={t(
                            copied ? 'page.itemDetail.copiedPath' : 'page.itemDetail.copyPath',
                            {},
                        )}
                        withinPortal
                    >
                        <ActionIcon onClick={copy} variant="transparent">
                            {copied ? <Icon icon="check" /> : <Icon icon="clipboardCopy" />}
                        </ActionIcon>
                    </Tooltip>
                )}
            </CopyButton>
            {util && (
                <Tooltip label={t('page.itemDetail.openFile')} withinPortal>
                    <ActionIcon
                        icon="externalLink"
                        onClick={() => {
                            util.openItem(resolvedPath).catch((error) => {
                                toast.error({
                                    message: (error as Error).message,
                                    title: t('error.openError'),
                                });
                            });
                        }}
                        variant="transparent"
                    />
                </Tooltip>
            )}
            <Text style={{ userSelect: 'all' }}>{resolvedPath}</Text>
        </Group>
    );
};
