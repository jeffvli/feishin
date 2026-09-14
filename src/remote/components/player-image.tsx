import clsx from 'clsx';

import styles from './player-image.module.css';

import { useSend } from '/@/remote/store';

interface PlayerImageProps {
    className?: string;
    src?: null | string;
}
export const PlayerImage = ({ className, src }: PlayerImageProps) => {
    const send = useSend();

    // `src` already IS the "public" URL, same mechanism tracks/albums/
    // playlists use — it's built with `getItemImageUrl({ useRemoteUrl: true
    // })` upstream, in the renderer's use-remote-push.tsx/use-remote.tsx,
    // before it's ever pushed over the WS `song`/`state` events this
    // component renders. `useRemoteUrl: true` swaps in the server's
    // configured `remoteUrl` (Settings → Servers) when one is set; if it
    // isn't, or still isn't reachable from the phone's network, this onError
    // is the fallback — the main process fetches the image itself (which,
    // running on the same machine as the desktop app, can always reach the
    // media server) and relays it back as a base64 data URI over the socket.
    // Not a workaround for a missing useRemoteUrl call, so don't remove it
    // without configuring/verifying remoteUrl reachability instead.
    return (
        <img
            className={clsx(styles.container, className)}
            onError={() => send({ event: 'proxy' })}
            src={src?.replaceAll(/&(size|width|height)=\d+/g, '')}
        />
    );
};
