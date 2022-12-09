import { useAuthStore } from '/@/store';
import { navidromeApi } from '/@/api/navidrome.api';
import { toast } from '/@/components';
import type {
  AlbumDetailArgs,
  RawAlbumDetailResponse,
  RawAlbumListResponse,
  AlbumListArgs,
  SongListArgs,
  RawSongListResponse,
  SongDetailArgs,
  RawSongDetailResponse,
  AlbumArtistDetailArgs,
  RawAlbumArtistDetailResponse,
  AlbumArtistListArgs,
  RawAlbumArtistListResponse,
  RatingArgs,
  RawRatingResponse,
  FavoriteArgs,
  RawFavoriteResponse,
  GenreListArgs,
  RawGenreListResponse,
  CreatePlaylistArgs,
  RawCreatePlaylistResponse,
  DeletePlaylistArgs,
  RawDeletePlaylistResponse,
  PlaylistDetailArgs,
  RawPlaylistDetailResponse,
  PlaylistListArgs,
  RawPlaylistListResponse,
} from '/@/api/types';
import { subsonicApi } from '/@/api/subsonic.api';

export type ControllerEndpoint = Partial<{
  clearPlaylist: () => void;
  createFavorite: (args: FavoriteArgs) => Promise<RawFavoriteResponse>;
  createPlaylist: (args: CreatePlaylistArgs) => Promise<RawCreatePlaylistResponse>;
  deleteFavorite: (args: FavoriteArgs) => Promise<RawFavoriteResponse>;
  deletePlaylist: (args: DeletePlaylistArgs) => Promise<RawDeletePlaylistResponse>;
  getAlbumArtistDetail: (args: AlbumArtistDetailArgs) => Promise<RawAlbumArtistDetailResponse>;
  getAlbumArtistList: (args: AlbumArtistListArgs) => Promise<RawAlbumArtistListResponse>;
  getAlbumDetail: (args: AlbumDetailArgs) => Promise<RawAlbumDetailResponse>;
  getAlbumList: (args: AlbumListArgs) => Promise<RawAlbumListResponse>;
  getArtistDetail: () => void;
  getArtistList: () => void;
  getFavoritesList: () => void;
  getFolderItemList: () => void;
  getFolderList: () => void;
  getFolderSongs: () => void;
  getGenreList: (args: GenreListArgs) => Promise<RawGenreListResponse>;
  getMusicFolderList: () => void;
  getPlaylistDetail: (args: PlaylistDetailArgs) => Promise<RawPlaylistDetailResponse>;
  getPlaylistList: (args: PlaylistListArgs) => Promise<RawPlaylistListResponse>;
  getSongDetail: (args: SongDetailArgs) => Promise<RawSongDetailResponse>;
  getSongList: (args: SongListArgs) => Promise<RawSongListResponse>;
  updatePlaylist: () => void;
  updateRating: (args: RatingArgs) => Promise<RawRatingResponse>;
}>;

type ApiController = {
  jellyfin: ControllerEndpoint;
  navidrome: ControllerEndpoint;
  subsonic: ControllerEndpoint;
};

const endpoints: ApiController = {
  jellyfin: {
    clearPlaylist: undefined,
    createFavorite: undefined,
    createPlaylist: undefined,
    deleteFavorite: undefined,
    deletePlaylist: undefined,
    getAlbumArtistDetail: undefined,
    getAlbumArtistList: undefined,
    getAlbumDetail: undefined,
    getAlbumList: undefined,
    getArtistDetail: undefined,
    getArtistList: undefined,
    getFavoritesList: undefined,
    getFolderItemList: undefined,
    getFolderList: undefined,
    getFolderSongs: undefined,
    getGenreList: undefined,
    getMusicFolderList: undefined,
    getPlaylistDetail: undefined,
    getPlaylistList: undefined,
    getSongList: undefined,
    updatePlaylist: undefined,
    updateRating: undefined,
  },
  navidrome: {
    clearPlaylist: undefined,
    createFavorite: subsonicApi.createFavorite,
    createPlaylist: navidromeApi.createPlaylist,
    deleteFavorite: subsonicApi.deleteFavorite,
    deletePlaylist: navidromeApi.deletePlaylist,
    getAlbumArtistDetail: navidromeApi.getAlbumArtistDetail,
    getAlbumArtistList: navidromeApi.getAlbumArtistList,
    getAlbumDetail: navidromeApi.getAlbumDetail,
    getAlbumList: navidromeApi.getAlbumList,
    getArtistDetail: undefined,
    getArtistList: undefined,
    getFavoritesList: undefined,
    getFolderItemList: undefined,
    getFolderList: undefined,
    getFolderSongs: undefined,
    getGenreList: navidromeApi.getGenreList,
    getMusicFolderList: undefined,
    getPlaylistDetail: navidromeApi.getPlaylistDetail,
    getPlaylistList: navidromeApi.getPlaylistList,
    getSongList: navidromeApi.getSongList,
    updatePlaylist: undefined,
    updateRating: subsonicApi.updateRating,
  },
  subsonic: {
    clearPlaylist: undefined,
    createFavorite: subsonicApi.createFavorite,
    createPlaylist: undefined,
    deleteFavorite: subsonicApi.deleteFavorite,
    deletePlaylist: undefined,
    getAlbumArtistDetail: subsonicApi.getAlbumArtistDetail,
    getAlbumArtistList: subsonicApi.getAlbumArtistList,
    getAlbumDetail: subsonicApi.getAlbumDetail,
    getAlbumList: subsonicApi.getAlbumList,
    getArtistDetail: undefined,
    getArtistList: undefined,
    getFavoritesList: undefined,
    getFolderItemList: undefined,
    getFolderList: undefined,
    getFolderSongs: undefined,
    getGenreList: undefined,
    getMusicFolderList: undefined,
    getPlaylistDetail: undefined,
    getPlaylistList: undefined,
    getSongList: undefined,
    updatePlaylist: undefined,
    updateRating: undefined,
  },
};

const apiController = (endpoint: keyof ControllerEndpoint) => {
  const serverType = useAuthStore.getState().currentServer?.type;

  if (!serverType) {
    toast.error({ message: 'No server selected', title: 'Unable to route request' });
    return () => undefined;
  }

  const controllerFn = endpoints[serverType][endpoint];

  if (typeof controllerFn !== 'function') {
    toast.error({
      message: `Endpoint ${endpoint} is not implemented for ${serverType}`,
      title: 'Unable to route request',
    });
    return () => undefined;
  }

  return endpoints[serverType][endpoint];
};

const getAlbumList = async (args: AlbumListArgs) => {
  return (apiController('getAlbumList') as ControllerEndpoint['getAlbumList'])?.(args);
};

const getAlbumDetail = async (args: AlbumDetailArgs) => {
  return (apiController('getAlbumDetail') as ControllerEndpoint['getAlbumDetail'])?.(args);
};

export const controller = {
  getAlbumDetail,
  getAlbumList,
};
