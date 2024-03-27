import React, { useEffect, useState } from 'react';
import { useSubscription } from 'observable-hooks';
import { CHANGE_NOTES } from './change-notes';
import { HomeComponent } from './components/home.component';
import { SettingsButton } from './components/settings/settings-button';
import styles from './css/app.module.scss';
import type { JukeboxSongState } from './models/jukebox-song-state';
import { version } from '../package.json';

const App = () => {
    console.log('Jukebox');
    // useSubscription(window.jukebox.songState$, setSongState);

    return (
        <AnimatedPage>
            <div>Jukebox Page</div>
        </AnimatedPage>
    );
    const [songState, setSongState] = useState<JukeboxSongState | null>(null);

    if (window.jukebox.isEnabled) {
        if (songState !== null) {
            return (
                <div className={styles['full-size-container']}>
                    <HomeComponent />
                </div>
            );
        }
        return (
            <div className={styles['empty-container']}>
                <div className={styles['elements-container']}>
                    <SettingsButton />
                    <div>
                        <h1>Loading...</h1>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className={styles['empty-container']}>
            <div className={styles['elements-container']}>
                <SettingsButton />
                <div>
                    <h1>Jukebox not enabled.</h1>
                </div>
            </div>
        </div>
    );
};

export default App;
