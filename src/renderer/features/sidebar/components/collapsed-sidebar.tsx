import { Group, UnstyledButton } from '@mantine/core';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine, RiMenuFill } from 'react-icons/ri';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { DropdownMenu, ScrollArea } from '/@/renderer/components';
import { CollapsedSidebarButton } from '/@/renderer/features/sidebar/components/collapsed-sidebar-button';
import { CollapsedSidebarItem } from '/@/renderer/features/sidebar/components/collapsed-sidebar-item';
import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { SidebarItemType, useGeneralSettings, useWindowSettings } from '/@/renderer/store';
import { Platform } from '/@/renderer/types';

const SidebarContainer = styled(motion.div)<{ $windowBarStyle: Platform }>`
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: ${(props) =>
        props.$windowBarStyle === Platform.WEB || props.$windowBarStyle === Platform.LINUX
            ? 'calc(100vh - 149px)'
            : 'calc(100vh - 119px)'};
    user-select: none;
`;

export const CollapsedSidebar = () => {
    const navigate = useNavigate();
    const { windowBarStyle } = useWindowSettings();
    const { sidebarItems, sidebarCollapsedNavigation } = useGeneralSettings();

    const sidebarItemsWithRoute: SidebarItemType[] = useMemo(() => {
        if (!sidebarItems) return [];

        const items = sidebarItems
            .filter((item) => !item.disabled)
            .map((item) => ({
                ...item,
            }));

        return items;
    }, [sidebarItems]);

    return (
        <SidebarContainer $windowBarStyle={windowBarStyle}>
            <ScrollArea
                scrollHideDelay={0}
                scrollbarSize={8}
            >
                {sidebarCollapsedNavigation && (
                    <Group
                        grow
                        spacing={0}
                        style={{
                            borderRight: 'var(--sidebar-border)',
                        }}
                    >
                        <CollapsedSidebarButton
                            component={UnstyledButton}
                            onClick={() => navigate(-1)}
                        >
                            <RiArrowLeftSLine size="22" />
                        </CollapsedSidebarButton>
                        <CollapsedSidebarButton
                            component={UnstyledButton}
                            onClick={() => navigate(1)}
                        >
                            <RiArrowRightSLine size="22" />
                        </CollapsedSidebarButton>
                    </Group>
                )}
                <DropdownMenu position="right-start">
                    <DropdownMenu.Target>
                        <CollapsedSidebarItem
                            activeIcon={<RiMenuFill size="25" />}
                            component={UnstyledButton}
                            icon={<RiMenuFill size="25" />}
                            label="Menu"
                        />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <AppMenu />
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                {sidebarItemsWithRoute.map((item) => (
                    <CollapsedSidebarItem
                        key={item.id}
                        activeIcon={
                            <SidebarIcon
                                active
                                route={item.route}
                                size="25"
                            />
                        }
                        component={NavLink}
                        icon={
                            <SidebarIcon
                                route={item.route}
                                size="25"
                            />
                        }
                        label={item.label}
                        route={item.route}
                        to={item.route}
                    />
                ))}
            </ScrollArea>
        </SidebarContainer>
    );
};
