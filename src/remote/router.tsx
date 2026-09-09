import { Route, Routes } from 'react-router';

import { RemoteContainer } from '/@/remote/components/remote-container';
import { LibraryPage } from '/@/remote/pages/library-page';
import { PlaylistsPage } from '/@/remote/pages/playlists-page';
import { QueuePage } from '/@/remote/pages/queue-page';
import { RadioPage } from '/@/remote/pages/radio-page';

export const RemoteRoutes = () => {
    return (
        <Routes>
            <Route element={<RemoteContainer />} index />
            <Route element={<LibraryPage />} path="library" />
            <Route element={<PlaylistsPage />} path="playlists" />
            <Route element={<RadioPage />} path="radio" />
            <Route element={<QueuePage />} path="queue" />
        </Routes>
    );
};
