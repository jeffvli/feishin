import { Loader } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeServerUrl } from '/@/renderer/utils/normalize-server-url';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Code } from '/@/shared/components/code/code';
import { CopyButton } from '/@/shared/components/copy-button/copy-button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

interface JellyfinQuickConnectButtonProps {
    code: null | string;
    disabled?: boolean;
    isLoading: boolean;
    onStart: () => void;
    onStop: () => void;
    url: string;
}

/**
 * Renders the Jellyfin Quick Connect flow: a single filled button to start
 * it, then the code, a copy action, an explicit (never auto-triggered) link
 * to the server's Quick Connect approval screen, and a cancel button. Shared
 * between the login route and the add server form so the two flows stay in
 * sync.
 */
export const JellyfinQuickConnectButton = ({
    code,
    disabled,
    isLoading,
    onStart,
    onStop,
    url,
}: JellyfinQuickConnectButtonProps) => {
    const { t } = useTranslation();

    const quickConnectUrl = useMemo(() => {
        const normalized = normalizeServerUrl(url);
        if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
            return null;
        }
        return `${normalized}/web/#/quickconnect`;
    }, [url]);

    if (!code) {
        return (
            <Button
                disabled={disabled}
                fullWidth
                loading={isLoading}
                onClick={onStart}
                variant="filled"
            >
                {t('form.addServer.input', { context: 'jellyfinQuickConnect' })}
            </Button>
        );
    }

    return (
        <Stack gap="xs">
            <Text size="sm" ta="center">
                {t('form.addServer.input', { context: 'jellyfinQuickConnectCode' })}
            </Text>
            <Group gap={6} justify="center">
                <Code fz="xl">{code}</Code>
                <CopyButton timeout={2000} value={code}>
                    {({ copied, copy }) => (
                        <Tooltip
                            label={t('form.addServer.input', {
                                context: copied
                                    ? 'jellyfinQuickConnectCodeCopied'
                                    : 'jellyfinQuickConnectCodeCopy',
                            })}
                            withinPortal
                        >
                            <ActionIcon onClick={copy} size="sm" variant="transparent">
                                {copied ? <Icon icon="check" /> : <Icon icon="clipboardCopy" />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                </CopyButton>
            </Group>
            {quickConnectUrl && (
                <Text
                    component="a"
                    href={quickConnectUrl}
                    isLink
                    rel="noopener noreferrer"
                    size="sm"
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: 4,
                        justifyContent: 'center',
                    }}
                    target="_blank"
                >
                    {t('form.addServer.input', { context: 'jellyfinQuickConnectOpen' })}
                    <Icon icon="externalLink" size="xs" />
                </Text>
            )}
            <Group gap={6} justify="center">
                <Loader size="xs" />
                <Text c="dimmed" size="xs">
                    {t('form.addServer.input', { context: 'jellyfinQuickConnectWaiting' })}
                </Text>
            </Group>
            <Button fullWidth onClick={onStop} variant="default">
                {t('common.cancel')}
            </Button>
        </Stack>
    );
};
