import { useEffect, useState } from 'react';

import packageJson from '../../../../../package.json';
import styles from './home-route.module.css';

import { controller } from '/@/renderer/api/controller';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import companyLogo from '/@/renderer/features/home/assets/katie-obriens-logo.webp';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { useServerLibraryControls } from '/@/renderer/features/shared/hooks/use-server-library-controls';
import { useCurrentServer } from '/@/renderer/store';
import { Select } from '/@/shared/components/select/select';

const SUPPORT_EMAIL = 'k.laws@katieobriensirishtaverns.com';
const SUPPORT_PHONE = '07969 765 597';
const CONNECTION_CHECK_INTERVAL_MS = 60_000;

type ConnectionStatus = 'checking' | 'connected' | 'not-connected' | 'offline' | 'unavailable';

const useServerConnectionStatus = (serverId?: string) => {
    const [status, setStatus] = useState<ConnectionStatus>(serverId ? 'checking' : 'not-connected');

    useEffect(() => {
        let active = true;
        let requestInFlight = false;

        const checkConnection = async (showCheckingState: boolean) => {
            if (!serverId) {
                setStatus('not-connected');
                return;
            }

            if (!navigator.onLine) {
                setStatus('offline');
                return;
            }

            if (requestInFlight) {
                return;
            }

            requestInFlight = true;
            if (showCheckingState) {
                setStatus('checking');
            }

            try {
                const serverInfo = await controller.getServerInfo({
                    apiClientProps: { serverId },
                });

                if (!serverInfo || serverInfo.id !== serverId) {
                    throw new Error('Server identity did not match the active connection');
                }

                if (active) {
                    setStatus('connected');
                }
            } catch {
                if (active) {
                    setStatus(navigator.onLine ? 'unavailable' : 'offline');
                }
            } finally {
                requestInFlight = false;
            }
        };

        const handleOffline = () => {
            setStatus(serverId ? 'offline' : 'not-connected');
        };

        const handleOnline = () => {
            void checkConnection(true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void checkConnection(false);
            }
        };

        void checkConnection(true);

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                void checkConnection(false);
            }
        }, CONNECTION_CHECK_INTERVAL_MS);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            active = false;
            window.clearInterval(intervalId);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [serverId]);

    return status;
};

const HomeRoute = () => {
    const server = useCurrentServer();
    const connectionStatus = useServerConnectionStatus(server?.id);
    const { musicFolders, musicFoldersQuery, selectedMusicFolders, selectMusicFolder } =
        useServerLibraryControls();
    const musicFolderOptions =
        musicFolders?.items.map((folder) => ({ label: folder.name, value: folder.id })) || [];
    const selectedMusicFolderId = selectedMusicFolders[0]?.id || null;
    const connectionLabel = {
        checking: 'Checking connection…',
        connected: `Connected to ${server?.name || 'server'}`,
        'not-connected': 'Not connected',
        offline: 'Offline — downloaded music available',
        unavailable: 'Server unavailable',
    }[connectionStatus];

    return (
        <AnimatedPage>
            <NativeScrollArea noHeader>
                <div className={styles.homePage}>
                    <div aria-hidden="true" className={styles.ambientGlow} />
                    <section aria-labelledby="katiesamp-home-title" className={styles.homeCard}>
                        <div className={styles.brandPanel}>
                            <div className={styles.logoFrame}>
                                <img
                                    alt="Katie O'Brien's Irish Taverns"
                                    className={styles.companyLogo}
                                    src={companyLogo}
                                />
                            </div>

                            <div className={styles.brandCopy}>
                                <p className={styles.eyebrow}>{"Katie O'Brien's Irish Taverns"}</p>
                                <h1 className={styles.productName} id="katiesamp-home-title">
                                    KatiesAmp
                                </h1>
                                <p className={styles.productDescription}>
                                    {"Your dedicated music player for Katie O'Brien's."}
                                </p>
                            </div>
                        </div>

                        <div className={styles.detailsPanel}>
                            <section className={styles.infoCard}>
                                <p className={styles.cardLabel}>Application</p>
                                <dl className={styles.detailsList}>
                                    <div className={styles.detailRow}>
                                        <dt>Software</dt>
                                        <dd>KatiesAmp</dd>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <dt>Version</dt>
                                        <dd>
                                            <span className={styles.versionBadge}>
                                                v{packageJson.version}
                                            </span>
                                        </dd>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <dt>User</dt>
                                        <dd>{server?.username || 'Not connected'}</dd>
                                    </div>
                                    <div className={`${styles.detailRow} ${styles.connectionRow}`}>
                                        <dt>Server status</dt>
                                        <dd aria-live="polite" className={styles.connectionStatus}>
                                            <span
                                                aria-hidden="true"
                                                className={styles.statusDot}
                                                data-status={connectionStatus}
                                            />
                                            <span className={styles.connectionLabel}>
                                                {connectionLabel}
                                            </span>
                                        </dd>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <dt>Music folder</dt>
                                        <dd className={styles.musicFolderControl}>
                                            <Select
                                                aria-label="Select music folder"
                                                data={musicFolderOptions}
                                                disabled={
                                                    musicFoldersQuery.isLoading ||
                                                    musicFoldersQuery.isError ||
                                                    !musicFolders?.items.length
                                                }
                                                onChange={(value) => {
                                                    if (value) selectMusicFolder(value);
                                                }}
                                                placeholder={
                                                    musicFoldersQuery.isLoading
                                                        ? 'Loading folders…'
                                                        : musicFolders?.items.length
                                                          ? 'Choose a music folder'
                                                          : 'Folders unavailable'
                                                }
                                                value={selectedMusicFolderId}
                                                width="100%"
                                            />
                                        </dd>
                                    </div>
                                </dl>
                            </section>

                            <section className={`${styles.infoCard} ${styles.supportCard}`}>
                                <p className={styles.cardLabel}>Technical support</p>
                                <h2 className={styles.supportName}>Kev Laws</h2>
                                <div className={styles.contactList}>
                                    <div className={styles.contactItem}>
                                        <span className={styles.contactType}>Phone</span>
                                        <span>{SUPPORT_PHONE}</span>
                                    </div>
                                    <div className={styles.contactItem}>
                                        <span className={styles.contactType}>Email</span>
                                        <span>{SUPPORT_EMAIL}</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </section>
                </div>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

const HomeRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <HomeRoute />
        </PageErrorBoundary>
    );
};

export default HomeRouteWithBoundary;
