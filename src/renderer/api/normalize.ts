import { jfNormalize } from '/@/renderer/api/jellyfin.api';
import type {
  JFAlbum,
  JFAlbumArtist,
  JFGenreList,
  JFMusicFolderList,
  JFPlaylist,
  JFSong,
} from '/@/renderer/api/jellyfin.types';
import { ndNormalize } from '/@/renderer/api/navidrome.api';
import type {
  NDAlbum,
  NDAlbumArtist,
  NDGenreList,
  NDPlaylist,
  NDSong,
  NDUser,
} from '/@/renderer/api/navidrome.types';
import { SSGenreList, SSMusicFolderList } from '/@/renderer/api/subsonic.types';
import type {
  Album,
  RawAlbumArtistListResponse,
  RawAlbumDetailResponse,
  RawAlbumListResponse,
  RawGenreListResponse,
  RawMusicFolderListResponse,
  RawPlaylistDetailResponse,
  RawPlaylistListResponse,
  RawSongListResponse,
  RawUserListResponse,
} from '/@/renderer/api/types';
import { ServerListItem } from '/@/renderer/types';

const albumList = (data: RawAlbumListResponse | undefined, server: ServerListItem | null) => {
  let albums;
  switch (server?.type) {
    case 'jellyfin':
      albums = data?.items.map((item) => jfNormalize.album(item as JFAlbum, server));
      break;
    case 'navidrome':
      albums = data?.items.map((item) => ndNormalize.album(item as NDAlbum, server));
      break;
    case 'subsonic':
      break;
  }

  return {
    items: albums,
    startIndex: data?.startIndex,
    totalRecordCount: data?.totalRecordCount,
  };
};

const albumDetail = (
  data: RawAlbumDetailResponse | undefined,
  server: ServerListItem | null,
): Album | undefined => {
  let album: Album | undefined;
  switch (server?.type) {
    case 'jellyfin':
      album = jfNormalize.album(data as JFAlbum, server);
      break;
    case 'navidrome':
      album = ndNormalize.album(data as NDAlbum, server);
      break;
    case 'subsonic':
      break;
  }

  return album;
};

const songList = (data: RawSongListResponse | undefined, server: ServerListItem | null) => {
  let songs;
  switch (server?.type) {
    case 'jellyfin':
      songs = data?.items.map((item) => jfNormalize.song(item as JFSong, server, ''));
      break;
    case 'navidrome':
      songs = data?.items.map((item) => ndNormalize.song(item as NDSong, server, ''));
      break;
    case 'subsonic':
      break;
  }

  return {
    items: songs,
    startIndex: data?.startIndex,
    totalRecordCount: data?.totalRecordCount,
  };
};

const musicFolderList = (
  data: RawMusicFolderListResponse | undefined,
  server: ServerListItem | null,
) => {
  let musicFolders;
  switch (server?.type) {
    case 'jellyfin':
      musicFolders = (data as JFMusicFolderList)?.map((item) => ({
        id: String(item.Id),
        name: item.Name,
      }));
      break;
    case 'navidrome':
      musicFolders = (data as SSMusicFolderList)?.map((item) => ({
        id: String(item.id),
        name: item.name,
      }));
      break;
    case 'subsonic':
      musicFolders = (data as SSMusicFolderList)?.map((item) => ({
        id: String(item.id),
        name: item.name,
      }));
      break;
  }

  return musicFolders;
};

const genreList = (data: RawGenreListResponse | undefined, server: ServerListItem | null) => {
  let genres;
  switch (server?.type) {
    case 'jellyfin':
      genres = (data as JFGenreList)?.Items.map((item) => ({
        id: String(item.Id),
        name: item.Name,
      })).sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'navidrome':
      genres = (data as NDGenreList)
        ?.map((item) => ({
          id: String(item.id),
          name: item.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'subsonic':
      genres = (data as SSGenreList)
        ?.map((item) => ({
          id: item.value,
          name: item.value,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return genres;
};

const albumArtistList = (
  data: RawAlbumArtistListResponse | undefined,
  server: ServerListItem | null,
) => {
  let albumArtists;
  switch (server?.type) {
    case 'jellyfin':
      albumArtists = data?.items.map((item) =>
        jfNormalize.albumArtist(item as JFAlbumArtist, server),
      );
      break;
    case 'navidrome':
      albumArtists = data?.items.map((item) => ndNormalize.albumArtist(item as NDAlbumArtist));
      break;
    case 'subsonic':
      break;
  }

  return {
    items: albumArtists,
    startIndex: data?.startIndex,
    totalRecordCount: data?.totalRecordCount,
  };
};

const playlistList = (data: RawPlaylistListResponse | undefined, server: ServerListItem | null) => {
  let playlists;
  switch (server?.type) {
    case 'jellyfin':
      playlists = data?.items.map((item) => jfNormalize.playlist(item as JFPlaylist, server));
      break;
    case 'navidrome':
      playlists = data?.items.map((item) => ndNormalize.playlist(item as NDPlaylist, server));
      break;
    case 'subsonic':
      break;
  }

  return {
    items: playlists,
    startIndex: data?.startIndex,
    totalRecordCount: data?.totalRecordCount,
  };
};

const playlistDetail = (
  data: RawPlaylistDetailResponse | undefined,
  server: ServerListItem | null,
) => {
  let playlist;
  switch (server?.type) {
    case 'jellyfin':
      playlist = jfNormalize.playlist(data as JFPlaylist, server);
      break;
    case 'navidrome':
      playlist = ndNormalize.playlist(data as NDPlaylist, server);
      break;
    case 'subsonic':
      break;
  }

  return playlist;
};

const userList = (data: RawUserListResponse | undefined, server: ServerListItem | null) => {
  let users;
  switch (server?.type) {
    case 'jellyfin':
      break;
    case 'navidrome':
      users = data?.items.map((item) => ndNormalize.user(item as NDUser));
      break;
    case 'subsonic':
      break;
  }

  return {
    items: users,
    startIndex: data?.startIndex,
    totalRecordCount: data?.totalRecordCount,
  };
};

export const normalize = {
  albumArtistList,
  albumDetail,
  albumList,
  genreList,
  musicFolderList,
  playlistDetail,
  playlistList,
  songList,
  userList,
};
