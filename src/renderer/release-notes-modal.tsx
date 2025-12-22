import { closeAllModals, openModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import packageJson from '../../package.json';

import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';

interface ReleaseNotesContentProps {
    onDismiss: () => void;
    version: string;
}

const ReleaseNotesContent = ({ onDismiss, version }: ReleaseNotesContentProps) => {
    const { t } = useTranslation();

    // Fetch release notes from GitHub API
    const {
        data: releaseData,
        isError,
        isLoading,
    } = useQuery({
        queryFn: async () => {
            const response = await axios.get(
                `https://api.github.com/repos/jeffvli/feishin/releases/tags/v${version}`,
            );
            return response.data;
        },
        queryKey: ['github-release', version],
        retry: 2,
    });

    // Convert markdown to HTML using GitHub's markdown API
    const { data: htmlContent, isLoading: isConverting } = useQuery({
        enabled: !!releaseData?.body,
        queryFn: async () => {
            const response = await axios.post(
                'https://api.github.com/markdown',
                {
                    mode: 'gfm',
                    text: releaseData.body,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    responseType: 'text',
                },
            );
            return response.data;
        },
        queryKey: ['github-markdown', releaseData?.body],
        retry: 2,
    });

    const sanitizedHtml = useMemo(() => {
        if (!htmlContent) return '';
        return DOMPurify.sanitize(htmlContent, {
            ALLOWED_ATTR: ['alt', 'href', 'src', 'title'],
            ALLOWED_TAGS: [
                'a',
                'blockquote',
                'br',
                'code',
                'em',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'img',
                'li',
                'ol',
                'p',
                'pre',
                'strong',
                'u',
                'ul',
            ],
        });
    }, [htmlContent]);

    if (isLoading || isConverting) {
        return (
            <Center h={400}>
                <Spinner />
            </Center>
        );
    }

    if (isError || !releaseData) {
        return (
            <Stack gap="md">
                <Text>{t('common.newVersion', { postProcess: 'sentenceCase', version })}</Text>
                <Text size="sm">{t('error.genericError', { postProcess: 'sentenceCase' })}</Text>
                <Group justify="flex-end">
                    <Button
                        component="a"
                        href={`https://github.com/jeffvli/feishin/releases/tag/v${version}`}
                        onClick={onDismiss}
                        rightSection={<Icon icon="externalLink" />}
                        target="_blank"
                        variant="filled"
                    >
                        {t('common.viewReleaseNotes', { postProcess: 'sentenceCase' })}
                    </Button>
                    <Button onClick={onDismiss} variant="default">
                        {t('common.dismiss', { postProcess: 'titleCase' })}
                    </Button>
                </Group>
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            <ScrollArea
                style={{
                    height: '400px',
                }}
            >
                <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
            </ScrollArea>
            <Group justify="flex-end">
                <Button
                    component="a"
                    href={`https://github.com/jeffvli/feishin/releases/tag/v${version}`}
                    onClick={onDismiss}
                    rightSection={<Icon icon="externalLink" />}
                    target="_blank"
                    variant="subtle"
                >
                    {t('action.viewMore', { postProcess: 'sentenceCase' })}
                </Button>
                <Button onClick={onDismiss} variant="filled">
                    {t('common.dismiss', { postProcess: 'titleCase' })}
                </Button>
            </Group>
        </Stack>
    );
};

export const ReleaseNotesModal = () => {
    const { version } = packageJson;
    const { t } = useTranslation();

    const [value, setValue] = useLocalStorage({ key: 'version' });

    const handleDismiss = useCallback(() => {
        setValue(version);
        closeAllModals();
    }, [setValue, version]);

    useEffect(() => {
        // If value is undefined, set it to current version but don't show modal
        if (value === undefined) {
            setValue(version);
            return;
        }

        // Only show modal if the stored version is different from current version
        if (value !== version) {
            openModal({
                children: <ReleaseNotesContent onDismiss={handleDismiss} version={version} />,
                onClose: handleDismiss,
                size: 'xl',
                title: t('common.newVersion', {
                    postProcess: 'sentenceCase',
                    version,
                }) as string,
            });
        }
    }, [handleDismiss, value, version, t, setValue]);

    return null;
};
