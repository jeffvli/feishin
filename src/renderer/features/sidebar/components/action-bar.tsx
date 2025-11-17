import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import styles from './action-bar.module.css';

import { useCommandPalette } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { TextInput } from '/@/shared/components/text-input/text-input';

export const ActionBar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { open } = useCommandPalette();

    return (
        <div className={styles.container}>
            <Grid
                display="flex"
                gutter="sm"
                style={{ padding: '0 var(--theme-spacing-md)' }}
                w="100%"
            >
                <Grid.Col span={8}>
                    <TextInput
                        leftSection={<Icon icon="search" />}
                        onClick={open}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                open();
                            }
                        }}
                        placeholder={t('common.search', { postProcess: 'titleCase' })}
                        readOnly
                    />
                </Grid.Col>
                <Grid.Col span={4}>
                    <Group gap="sm" grow wrap="nowrap">
                        <Button onClick={() => navigate(-1)} p="0.5rem">
                            <Icon icon="arrowLeftS" />
                        </Button>
                        <Button onClick={() => navigate(1)} p="0.5rem">
                            <Icon icon="arrowRightS" />
                        </Button>
                    </Group>
                </Grid.Col>
            </Grid>
        </div>
    );
};
