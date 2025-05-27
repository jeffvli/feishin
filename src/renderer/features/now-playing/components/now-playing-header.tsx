import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { LibraryHeaderBar } from '/@/renderer/features/shared';

export const NowPlayingHeader = () => {
    // const currentSong = useCurrentSong();
    // const theme = useTheme();

    return (
        <PageHeader>
            <LibraryHeaderBar>
                <LibraryHeaderBar.Title>Queue</LibraryHeaderBar.Title>
            </LibraryHeaderBar>
        </PageHeader>
    );
};
