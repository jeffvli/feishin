import { useState } from 'react';

import styles from './ios-welcome.module.css';

import { sourMedia } from '/@/renderer/features/sour/mobile/android';

// The iPhone app's first screen: where your Hermes Music is. The app then runs Sour Player from
// there (see setServer in SourMedia.swift), so your music server works and updates come with Hermes.
export const IosWelcome = () => {
    const [address, setAddress] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const connect = async () => {
        if (!address.trim()) return;
        setBusy(true);
        setError('');
        try {
            await sourMedia('setServer', { url: address.trim() });
        } catch (e) {
            setError((e as Error).message);
            setBusy(false);
        }
    };
    return (
        <div className={styles.screen}>
            <div className={styles.card}>
                <img alt="" className={styles.icon} src="./assets/512x512.png" />
                <h1 className={styles.title}>Sour Player</h1>
                <p className={styles.lead}>Your music, from Hermes Music.</p>
                <label className={styles.label} htmlFor="sour-hermes">
                    Hermes Music address
                </label>
                <input
                    autoCapitalize="off"
                    autoComplete="url"
                    autoCorrect="off"
                    className={styles.input}
                    id="sour-hermes"
                    inputMode="url"
                    onChange={(e) => setAddress(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && connect()}
                    placeholder="umbrel.local:3340"
                    value={address}
                />
                <p className={styles.hint}>
                    The address of your Hermes Music page, e.g. umbrel.local:3340 at home, or your
                    Umbrel&#39;s Tailscale name with :3340 when you&#39;re out.
                </p>
                {error && <p className={styles.error}>{error}</p>}
                <button
                    className={styles.button}
                    disabled={busy || !address.trim()}
                    onClick={connect}
                    type="button"
                >
                    {busy ? 'Connecting...' : 'Connect'}
                </button>
            </div>
        </div>
    );
};
