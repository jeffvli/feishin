import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import styles from './action-bar.module.css';

import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCommandPalette } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { TextInput } from '/@/shared/components/text-input/text-input';

export const ActionBar = () => {
    const { t } = useTranslation();
    const cq = useContainerQuery({ md: 300 });
    const navigate = useNavigate();
    const { open } = useCommandPalette();

    return (
        <div
            className={styles.container}
            ref={cq.ref}
        >
            <Grid
                display="flex"
                gutter="sm"
                px="1rem"
                w="100%"
            >
                <Grid.Col span={6}>
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
                <Grid.Col span={6}>
                    <Group
                        gap="sm"
                        grow
                        wrap="nowrap"
                    >
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <Button p="0.5rem">
                                    <Icon icon="menu" />
                                </Button>
                            </DropdownMenu.Target>
                            <DropdownMenu.Dropdown>
                                <AppMenu />
                            </DropdownMenu.Dropdown>
                        </DropdownMenu>
                        <Button
                            onClick={() => navigate(-1)}
                            p="0.5rem"
                        >
                            <Icon icon="arrowLeftS" />
                        </Button>
                        <Button
                            onClick={() => navigate(1)}
                            p="0.5rem"
                        >
                            <Icon icon="arrowRightS" />
                        </Button>
                    </Group>
                </Grid.Col>
            </Grid>
        </div>
    );
};
