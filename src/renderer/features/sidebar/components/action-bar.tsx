import { useTranslation } from 'react-i18next';
import { RiArrowLeftSLine, RiArrowRightSLine, RiMenuFill, RiSearchLine } from 'react-icons/ri';
import { useNavigate } from 'react-router';

import styles from './action-bar.module.css';

import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCommandPalette } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
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
            {cq.isMd ? (
                <Grid
                    display="flex"
                    gutter="sm"
                    px="1rem"
                    w="100%"
                >
                    <Grid.Col span={6}>
                        <TextInput
                            leftSection={<RiSearchLine />}
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
                                        <RiMenuFill />
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
                                <RiArrowLeftSLine size="1rem" />
                            </Button>
                            <Button
                                onClick={() => navigate(1)}
                                p="0.5rem"
                            >
                                <RiArrowRightSLine size="1rem" />
                            </Button>
                        </Group>
                    </Grid.Col>
                </Grid>
            ) : (
                <Group
                    gap="sm"
                    grow
                    px="1rem"
                    w="100%"
                >
                    <Button
                        onClick={open}
                        p="0.5rem"
                        size="md"
                    >
                        <RiSearchLine size="1rem" />
                    </Button>
                    <DropdownMenu position="bottom-start">
                        <DropdownMenu.Target>
                            <Button
                                p="0.5rem"
                                size="md"
                            >
                                <RiMenuFill size="1rem" />
                            </Button>
                        </DropdownMenu.Target>
                        <DropdownMenu.Dropdown>
                            <AppMenu />
                        </DropdownMenu.Dropdown>
                    </DropdownMenu>
                    <Button
                        onClick={() => navigate(-1)}
                        p="0.5rem"
                        size="md"
                    >
                        <RiArrowLeftSLine size="1.5rem" />
                    </Button>
                    <Button
                        onClick={() => navigate(1)}
                        p="0.5rem"
                        size="md"
                    >
                        <RiArrowRightSLine size="1.5rem" />
                    </Button>
                </Group>
            )}
        </div>
    );
};
