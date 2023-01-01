import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { AnimatedPage } from '/@/renderer/features/shared';

const PlaylistDetailRoute = () => {
  // const tableRef = useRef<AgGridReactType | null>(null);
  const { playlistId } = useParams() as { playlistId: string };

  // const detailsQuery = usePlaylistDetail({
  //   id: playlistId,
  // });

  // const playlistSongsQuery = usePlaylistSongList({
  //   id: playlistId,
  //   limit: 50,
  //   startIndex: 0,
  // });

  // const imageUrl = playlistSongsQuery.data?.items?.[0]?.imageUrl;
  // const background = useFastAverageColor(imageUrl);
  // const containerRef = useRef();

  // const { ref, entry } = useIntersection({
  //   root: containerRef.current,
  //   threshold: 0.3,
  // });

  return <AnimatedPage key={`playlist-detail-${playlistId}`}>Placeholder</AnimatedPage>;
};

export default PlaylistDetailRoute;
