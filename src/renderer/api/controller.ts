import { useAuthStore } from '/@/renderer/store';
import { navidromeApi } from '/@/renderer/api/navidrome.api';
import { toast } from '/@/renderer/components/toast';
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
  MusicFolderListArgs,
  RawMusicFolderListResponse,
  PlaylistSongListArgs,
  ArtistListArgs,
  RawArtistListResponse,
} from '/@/renderer/api/types';
import { subsonicApi } from '/@/renderer/api/subsonic.api';
import { jellyfinApi } from '/@/renderer/api/jellyfin.api';

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
  getArtistList: (args: ArtistListArgs) => Promise<RawArtistListResponse>;
  getFavoritesList: () => void;
  getFolderItemList: () => void;
  getFolderList: () => void;
  getFolderSongs: () => void;
  getGenreList: (args: GenreListArgs) => Promise<RawGenreListResponse>;
  getMusicFolderList: (args: MusicFolderListArgs) => Promise<RawMusicFolderListResponse>;
  getPlaylistDetail: (args: PlaylistDetailArgs) => Promise<RawPlaylistDetailResponse>;
  getPlaylistList: (args: PlaylistListArgs) => Promise<RawPlaylistListResponse>;
  getPlaylistSongList: (args: PlaylistSongListArgs) => Promise<RawSongListResponse>;
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
    createFavorite: jellyfinApi.createFavorite,
    createPlaylist: jellyfinApi.createPlaylist,
    deleteFavorite: jellyfinApi.deleteFavorite,
    deletePlaylist: jellyfinApi.deletePlaylist,
    getAlbumArtistDetail: jellyfinApi.getAlbumArtistDetail,
    getAlbumArtistList: jellyfinApi.getAlbumArtistList,
    getAlbumDetail: jellyfinApi.getAlbumDetail,
    getAlbumList: jellyfinApi.getAlbumList,
    getArtistDetail: undefined,
    getArtistList: jellyfinApi.getArtistList,
    getFavoritesList: undefined,
    getFolderItemList: undefined,
    getFolderList: undefined,
    getFolderSongs: undefined,
    getGenreList: jellyfinApi.getGenreList,
    getMusicFolderList: jellyfinApi.getMusicFolderList,
    getPlaylistDetail: jellyfinApi.getPlaylistDetail,
    getPlaylistList: jellyfinApi.getPlaylistList,
    getPlaylistSongList: jellyfinApi.getPlaylistSongList,
    getSongDetail: undefined,
    getSongList: jellyfinApi.getSongList,
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
    getPlaylistSongList: navidromeApi.getPlaylistSongList,
    getSongDetail: navidromeApi.getSongDetail,
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
    getSongDetail: undefined,
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

const getSongList = async (args: SongListArgs) => {
  return (apiController('getSongList') as ControllerEndpoint['getSongList'])?.(args);
};

export const controller = {
  getAlbumDetail,
  getAlbumList,
  getSongList,
};
