import { Group, UnstyledButton } from '@mantine/core';
import { CollapsedSidebarButton } from '/@/renderer/features/sidebar/components/collapsed-sidebar-button';
import { useCurrentServer } from '/@/renderer/store';
import { RiRefreshFill, RiScan2Line, RiScanLine } from 'react-icons/ri';
import { api } from '/@/renderer/api';
import styled from 'styled-components';
import {
    MutableRefObject,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { ServerType } from '/@/renderer/types';
import { DropdownMenu, toast } from '/@/renderer/components';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { ScanStatus } from '/@/renderer/api/types';
import { rotating } from '/@/renderer/styles';

const SpinningRefresh = styled(RiRefreshFill)`
    ${rotating}
    animation: rotating 2s ease-in-out infinite;
`;

const RescanContext = createContext<{
    scanStatus: ScanStatus;
    setScanStatus?: (status: ScanStatus) => void;
}>({
    scanStatus: { scanning: false },
});

export const RescanProvider = ({ children }: { children: ReactNode }) => {
    const [scanStatus, setScanStatus] = useState<ScanStatus>({ scanning: false });

    const providerValue = useMemo(() => {
        return { scanStatus, setScanStatus };
    }, [scanStatus]);

    return <RescanContext.Provider value={providerValue}>{children}</RescanContext.Provider>;
};

const RescanMenu = ({
    timerRef,
}: {
    timerRef: MutableRefObject<ReturnType<typeof setInterval> | undefined>;
}) => {
    const server = useCurrentServer();
    const {
        scanStatus: { scanning, folders, tracks },
        setScanStatus,
    } = useContext(RescanContext);

    const isNavidrome = server?.type === ServerType.NAVIDROME;

    useEffect(() => {
        if (
            scanning &&
            timerRef.current === undefined &&
            server &&
            server.type !== ServerType.JELLYFIN
        ) {
            timerRef.current = setInterval(async () => {
                const status = await api.controller.getScanStatus({ apiClientProps: { server } });
                if (status) {
                    setScanStatus!(status);

                    if (scanning && !status.scanning) {
                        toast.success({
                            message: 'Scan completed',
                        });
                    }
                }
            }, 5000);
        } else if (!scanning && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = undefined;
        }
    }, [scanning, server, setScanStatus, timerRef]);

    const handleRefresh = useCallback(
        async (full?: boolean) => {
            try {
                if (!server) return;

                const results = await api.controller.rescan({
                    apiClientProps: { server },
                    full,
                });
                if (server.type === ServerType.JELLYFIN) {
                    toast.success({
                        message: 'Scan started. Note that Jellyfin does not report progress',
                        title: 'Started sync',
                    });
                } else if (results) {
                    toast.success({
                        message: 'Scan started.',
                        title: 'Started sync',
                    });
                    setScanStatus!({ ...results, scanning: true });
                }
            } catch (error) {
                console.error(error);
            }
        },
        [server, setScanStatus],
    );

    return (
        <>
            {scanning && (
                <DropdownMenu.Item
                    disabled
                    closeMenuOnClick={false}
                >
                    Currently scanning...
                </DropdownMenu.Item>
            )}
            {!scanning && (
                <DropdownMenu.Item
                    closeMenuOnClick={server?.type === ServerType.JELLYFIN}
                    icon={<RiScanLine />}
                    onClick={() => handleRefresh(isNavidrome ? false : undefined)}
                >
                    Start scan
                </DropdownMenu.Item>
            )}
            {isNavidrome && !scanning && (
                <DropdownMenu.Item
                    closeMenuOnClick={false}
                    icon={<RiScan2Line />}
                    onClick={() => {
                        handleRefresh(true);
                    }}
                >
                    Start full scan
                </DropdownMenu.Item>
            )}
            {(isNavidrome || server?.type === ServerType.SUBSONIC) && (
                <>
                    <DropdownMenu.Item disabled>Folders: {folders ?? '-'}</DropdownMenu.Item>
                    <DropdownMenu.Item disabled>Tracks: {tracks ?? '-'}</DropdownMenu.Item>
                </>
            )}
        </>
    );
};

export const RescanButton = () => {
    const { scanStatus, setScanStatus } = useContext(RescanContext);
    const timerRef = useRef<ReturnType<typeof setInterval>>();
    const server = useCurrentServer();

    useEffect(() => {
        if (setScanStatus) setScanStatus({ scanning: false });
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = undefined;
            }
        };
    }, [server, setScanStatus]);

    return (
        <DropdownMenu position="right-start">
            <DropdownMenu.Target>
                <CollapsedSidebarButton component={UnstyledButton}>
                    {scanStatus.scanning ? (
                        <SpinningRefresh size="25" />
                    ) : (
                        <RiRefreshFill size="25" />
                    )}
                    Rescan {scanStatus.scanning ? 'in progress' : ''}
                </CollapsedSidebarButton>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                <RescanMenu timerRef={timerRef} />
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};

export const RescanSiderbar = () => {
    const { scanStatus, setScanStatus } = useContext(RescanContext);
    const server = useCurrentServer();
    const timerRef = useRef<ReturnType<typeof setInterval>>();

    useEffect(() => {
        if (setScanStatus) setScanStatus({ scanning: false });
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = undefined;
            }
        };
    }, [server, setScanStatus]);

    return (
        // Note, tabIndex -1 is intentional here to make the Button the tabable component
        <SidebarItem tabIndex={-1}>
            <DropdownMenu position="bottom">
                <DropdownMenu.Target>
                    <UnstyledButton
                        p="sm"
                        pl="1rem"
                        sx={{ color: 'var(--sidebar-fg)' }}
                        w="100%"
                    >
                        <Group spacing="sm">
                            {scanStatus.scanning ? (
                                <SpinningRefresh size="1.1em" />
                            ) : (
                                <RiRefreshFill size="1.1em" />
                            )}
                            Rescan {scanStatus.scanning ? 'in progress' : ''}
                        </Group>
                    </UnstyledButton>
                </DropdownMenu.Target>
                <DropdownMenu.Dropdown>
                    <RescanMenu timerRef={timerRef} />
                </DropdownMenu.Dropdown>
            </DropdownMenu>
        </SidebarItem>
    );
};
