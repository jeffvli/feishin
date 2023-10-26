import { Grid, Group } from '@mantine/core';
import { RiSearchLine, RiMenuFill, RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button, DropdownMenu, TextInput } from '/@/renderer/components';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCommandPalette } from '/@/renderer/store';

const ActionsContainer = styled.div`
    display: flex;
    align-items: center;
    height: 70px;
    -webkit-app-region: drag;

    input {
        -webkit-app-region: no-drag;
    }
`;

export const ActionBar = () => {
    const cq = useContainerQuery({ md: 300 });
    const navigate = useNavigate();
    const { open } = useCommandPalette();

    return (
        <ActionsContainer ref={cq.ref}>
            {cq.isMd ? (
                <Grid
                    display="flex"
                    gutter="sm"
                    px="1rem"
                    w="100%"
                >
                    <Grid.Col span={6}>
                        <TextInput
                            readOnly
                            icon={<RiSearchLine />}
                            size="md"
                            onClick={open}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    open();
                                }
                            }}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Group
                            grow
                            noWrap
                            spacing="sm"
                        >
                            <DropdownMenu position="bottom-start">
                                <DropdownMenu.Target>
                                    <Button
                                        p="0.5rem"
                                        size="md"
                                        variant="default"
                                    >
                                        <RiMenuFill size="1rem" />
                                    </Button>
                                </DropdownMenu.Target>
                                <DropdownMenu.Dropdown>
                                    <AppMenu />
                                </DropdownMenu.Dropdown>
                            </DropdownMenu>
                            <Button
                                p="0.5rem"
                                size="md"
                                variant="default"
                                onClick={() => navigate(-1)}
                            >
                                <RiArrowLeftSLine size="1.5rem" />
                            </Button>
                            <Button
                                p="0.5rem"
                                size="md"
                                variant="default"
                                onClick={() => navigate(1)}
                            >
                                <RiArrowRightSLine size="1.5rem" />
                            </Button>
                        </Group>
                    </Grid.Col>
                </Grid>
            ) : (
                <Group
                    grow
                    px="1rem"
                    spacing="sm"
                    w="100%"
                >
                    <Button
                        p="0.5rem"
                        size="md"
                        variant="default"
                        onClick={open}
                    >
                        <RiSearchLine size="1rem" />
                    </Button>
                    <DropdownMenu position="bottom-start">
                        <DropdownMenu.Target>
                            <Button
                                p="0.5rem"
                                size="md"
                                variant="default"
                            >
                                <RiMenuFill size="1rem" />
                            </Button>
                        </DropdownMenu.Target>
                        <DropdownMenu.Dropdown>
                            <AppMenu />
                        </DropdownMenu.Dropdown>
                    </DropdownMenu>
                    <Button
                        p="0.5rem"
                        size="md"
                        variant="default"
                        onClick={() => navigate(-1)}
                    >
                        <RiArrowLeftSLine size="1.5rem" />
                    </Button>
                    <Button
                        p="0.5rem"
                        size="md"
                        variant="default"
                        onClick={() => navigate(1)}
                    >
                        <RiArrowRightSLine size="1.5rem" />
                    </Button>
                </Group>
            )}
        </ActionsContainer>
    );
};
