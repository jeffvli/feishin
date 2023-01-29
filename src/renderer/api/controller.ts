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
  UpdatePlaylistArgs,
  RawUpdatePlaylistResponse,
  UserListArgs,
  RawUserListResponse,
  FavoriteArgs,
  TopSongListArgs,
  RawTopSongListResponse,
  AddToPlaylistArgs,
  RawAddToPlaylistResponse,
  RemoveFromPlaylistArgs,
  RawRemoveFromPlaylistResponse,
} from '/@/renderer/api/types';
import { subsonicApi } from '/@/renderer/api/subsonic.api';
import { jellyfinApi } from '/@/renderer/api/jellyfin.api';

export type ControllerEndpoint = Partial<{
  addToPlaylist: (args: AddToPlaylistArgs) => Promise<RawAddToPlaylistResponse>;
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
  getArtistInfo: (args: any) => void;
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
  getTopSongs: (args: TopSongListArgs) => Promise<RawTopSongListResponse>;
  getUserList: (args: UserListArgs) => Promise<RawUserListResponse>;
  removeFromPlaylist: (args: RemoveFromPlaylistArgs) => Promise<RawRemoveFromPlaylistResponse>;
  updatePlaylist: (args: UpdatePlaylistArgs) => Promise<RawUpdatePlaylistResponse>;
  updateRating: (args: RatingArgs) => Promise<RawRatingResponse>;
}>;

type ApiController = {
  jellyfin: ControllerEndpoint;
  navidrome: ControllerEndpoint;
  subsonic: ControllerEndpoint;
};

const endpoints: ApiController = {
  jellyfin: {
    addToPlaylist: jellyfinApi.addToPlaylist,
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
    getArtistInfo: undefined,
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
    getTopSongs: undefined,
    getUserList: undefined,
    removeFromPlaylist: jellyfinApi.removeFromPlaylist,
    updatePlaylist: jellyfinApi.updatePlaylist,
    updateRating: undefined,
  },
  navidrome: {
    addToPlaylist: navidromeApi.addToPlaylist,
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
    getArtistInfo: undefined,
    getArtistList: undefined,
    getFavoritesList: undefined,
    getFolderItemList: undefined,
    getFolderList: undefined,
    getFolderSongs: undefined,
    getGenreList: navidromeApi.getGenreList,
    getMusicFolderList: subsonicApi.getMusicFolderList,
    getPlaylistDetail: navidromeApi.getPlaylistDetail,
    getPlaylistList: navidromeApi.getPlaylistList,
    getPlaylistSongList: navidromeApi.getPlaylistSongList,
    getSongDetail: navidromeApi.getSongDetail,
    getSongList: navidromeApi.getSongList,
    getTopSongs: subsonicApi.getTopSongList,
    getUserList: navidromeApi.getUserList,
    removeFromPlaylist: navidromeApi.removeFromPlaylist,
    updatePlaylist: navidromeApi.updatePlaylist,
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
    getArtistInfo: undefined,
    getArtistList: undefined,
    getFavoritesList: undefined,
    getFolderItemList: undefined,
    getFolderList: undefined,
    getFolderSongs: undefined,
    getGenreList: undefined,
    getMusicFolderList: subsonicApi.getMusicFolderList,
    getPlaylistDetail: undefined,
    getPlaylistList: undefined,
    getSongDetail: undefined,
    getSongList: undefined,
    getTopSongs: subsonicApi.getTopSongList,
    getUserList: undefined,
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

const getMusicFolderList = async (args: MusicFolderListArgs) => {
  return (apiController('getMusicFolderList') as ControllerEndpoint['getMusicFolderList'])?.(args);
};

const getGenreList = async (args: GenreListArgs) => {
  return (apiController('getGenreList') as ControllerEndpoint['getGenreList'])?.(args);
};

const getAlbumArtistDetail = async (args: AlbumArtistDetailArgs) => {
  return (apiController('getAlbumArtistDetail') as ControllerEndpoint['getAlbumArtistDetail'])?.(
    args,
  );
};

const getAlbumArtistList = async (args: AlbumArtistListArgs) => {
  return (apiController('getAlbumArtistList') as ControllerEndpoint['getAlbumArtistList'])?.(args);
};

const getArtistList = async (args: ArtistListArgs) => {
  return (apiController('getArtistList') as ControllerEndpoint['getArtistList'])?.(args);
};

const getPlaylistList = async (args: PlaylistListArgs) => {
  return (apiController('getPlaylistList') as ControllerEndpoint['getPlaylistList'])?.(args);
};

const createPlaylist = async (args: CreatePlaylistArgs) => {
  return (apiController('createPlaylist') as ControllerEndpoint['createPlaylist'])?.(args);
};

const updatePlaylist = async (args: UpdatePlaylistArgs) => {
  return (apiController('updatePlaylist') as ControllerEndpoint['updatePlaylist'])?.(args);
};

const deletePlaylist = async (args: DeletePlaylistArgs) => {
  return (apiController('deletePlaylist') as ControllerEndpoint['deletePlaylist'])?.(args);
};

const addToPlaylist = async (args: AddToPlaylistArgs) => {
  return (apiController('addToPlaylist') as ControllerEndpoint['addToPlaylist'])?.(args);
};

const removeFromPlaylist = async (args: RemoveFromPlaylistArgs) => {
  return (apiController('removeFromPlaylist') as ControllerEndpoint['removeFromPlaylist'])?.(args);
};

const getPlaylistDetail = async (args: PlaylistDetailArgs) => {
  return (apiController('getPlaylistDetail') as ControllerEndpoint['getPlaylistDetail'])?.(args);
};

const getPlaylistSongList = async (args: PlaylistSongListArgs) => {
  return (apiController('getPlaylistSongList') as ControllerEndpoint['getPlaylistSongList'])?.(
    args,
  );
};

const getUserList = async (args: UserListArgs) => {
  return (apiController('getUserList') as ControllerEndpoint['getUserList'])?.(args);
};

const createFavorite = async (args: FavoriteArgs) => {
  return (apiController('createFavorite') as ControllerEndpoint['createFavorite'])?.(args);
};

const deleteFavorite = async (args: FavoriteArgs) => {
  return (apiController('deleteFavorite') as ControllerEndpoint['deleteFavorite'])?.(args);
};

const updateRating = async (args: RatingArgs) => {
  return (apiController('updateRating') as ControllerEndpoint['updateRating'])?.(args);
};

const getTopSongList = async (args: TopSongListArgs) => {
  return (apiController('getTopSongs') as ControllerEndpoint['getTopSongs'])?.(args);
};

export const controller = {
  addToPlaylist,
  createFavorite,
  createPlaylist,
  deleteFavorite,
  deletePlaylist,
  getAlbumArtistDetail,
  getAlbumArtistList,
  getAlbumDetail,
  getAlbumList,
  getArtistList,
  getGenreList,
  getMusicFolderList,
  getPlaylistDetail,
  getPlaylistList,
  getPlaylistSongList,
  getSongList,
  getTopSongList,
  getUserList,
  removeFromPlaylist,
  updatePlaylist,
  updateRating,
};
