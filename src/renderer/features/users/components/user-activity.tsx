import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import merge from 'lodash/merge';
import sortBy from 'lodash/sortBy';
import styled from 'styled-components';
import { socket } from '@/renderer/api';
import { UserListResponse } from '@/renderer/api/users.api';
import {
  Activity,
  UserActivityItem,
  UserWithActivity,
} from '@/renderer/features/users/components/user-activity-item';
import { useUserList } from '@/renderer/features/users/queries/get-user-list';
import { useAuthStore, usePlayerStore } from '@/renderer/store';
import { PlayerStatus } from '@/renderer/types';

const UserActivityContainer = styled(motion.div)`
  min-height: 10rem;
  overflow-x: hidden;
`;

type UserConnectionEvent = {
  online?: string[];
  socketId: string;
  userId: string;
  userName: string;
};

type SongChangeEvent = {
  song: Activity['song'];
  user: UserConnectionEvent;
};

type CheckOnlineEvent = {
  online: string[];
};

type PlayStatusChangeEvent = {
  status: Activity['status'];
  user: UserConnectionEvent;
};

const sortByName = (users: UserWithActivity[]) => {
  return sortBy(users, [
    (user) => user.displayName?.toLowerCase(),
    (user) => user.username.toLowerCase(),
  ]);
};

export const UserActivity = () => {
  const currentSong = usePlayerStore((state) => state.current.song);
  const currentUser = useAuthStore((state) => state.permissions);
  const playStatus = usePlayerStore((state) => state.current.status);
  const [activityList, setActivityList] = useState<UserWithActivity[]>([]);

  const userDetails = useMemo(
    () => ({ userId: currentUser?.id, userName: currentUser?.username }),
    [currentUser?.id, currentUser?.username]
  );

  useUserList({
    onSuccess: async (data: UserListResponse) => {
      const userList = data.data.filter((user) => user.id !== currentUser?.id);
      setActivityList((prev) => {
        const newList = userList.map((user) => {
          const existingUser = prev.find((u) => u.id === user.id);
          return merge({}, existingUser, user);
        });
        return sortByName(newList);
      });

      if (userDetails) {
        socket.emit('user:send:get_online', userDetails);
      }
    },
    staleTime: 0,
  });

  const handleGetOnlineUsers = useCallback((data: CheckOnlineEvent) => {
    setActivityList((prev) => {
      const updatedUsers = prev.map((user) => {
        if (data.online.includes(user.id)) {
          return {
            ...user,
            activity: {
              ...user.activity,
              status: 'idle' as Activity['status'],
            },
          };
        }
        return {
          ...user,
          activity: {
            ...user.activity,
            status: 'offline' as Activity['status'],
          },
        };
      });
      return sortByName(updatedUsers);
    });
  }, []);

  const handleUserConnect = useCallback((data: UserConnectionEvent) => {
    setActivityList((prev) => {
      const user = prev.find((user) => user.id === data.userId);
      if (!user) return prev;

      return sortByName([
        ...prev.filter((user) => user.id !== data.userId),
        {
          ...user,
          activity: {
            ...user?.activity,
            socketId: data.socketId,
            status: 'idle',
          },
        },
      ]);
    });
  }, []);

  const handleUserDisconnect = useCallback((data: UserConnectionEvent) => {
    setActivityList((prev) => {
      const user = prev.find((user) => user.id === data.userId);
      if (!user) return prev;

      return sortByName([
        ...prev.filter((user) => user.id !== data.userId),
        {
          ...user,
          activity: {
            ...user?.activity,
            socketId: undefined,
            song: undefined,
            status: 'offline',
          },
        },
      ]);
    });
  }, []);

  const handleUserSongChange = useCallback((data: SongChangeEvent) => {
    setActivityList((prev) => {
      const user = prev.find((user) => user.id === data.user.userId);
      if (!user) return prev;

      const shouldUpdateStatus =
        !user?.activity?.status || user?.activity?.status === 'offline';

      return sortByName([
        ...prev.filter((user) => user.id !== data.user.userId),
        {
          ...user,
          activity: {
            ...user.activity,
            socketId: data.user.socketId,
            song: data.song,
            status: shouldUpdateStatus ? 'playing' : user?.activity?.status,
          },
        },
      ]);
    });
  }, []);

  const handleUserStatusChange = useCallback((data: PlayStatusChangeEvent) => {
    console.log('data', data);
    setActivityList((prev) => {
      const user = prev.find((user) => user.id === data.user.userId);
      if (!user) return prev;

      console.log('data.status', data.status);

      return sortByName([
        ...prev.filter((user) => user.id !== data.user.userId),
        {
          ...user,
          activity: {
            ...user.activity,
            socketId: data.user.socketId,
            status: data.status,
          },
        },
      ]);
    });
  }, []);

  useEffect(() => {
    if (currentSong) {
      const currentSongDetails: Activity['song'] = {
        album: currentSong?.album?.name,
        albumArtists: currentSong?.album?.albumArtists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
        albumId: currentSong?.album?.id,
        id: currentSong?.id,
        name: currentSong?.name,
        serverId: currentSong?.serverId,
      };

      socket.emit('user:send:change_song', {
        song: currentSongDetails,
        user: userDetails,
      });
    }
  }, [currentSong, playStatus, userDetails]);

  useEffect(() => {
    if (playStatus === PlayerStatus.PAUSED) {
      socket.emit('user:send:status_idle', { user: userDetails });
    } else {
      socket.emit('user:send:status_playing', { user: userDetails });
    }
  }, [playStatus, userDetails]);

  useEffect(() => {
    socket.on('user:receive:connect', (data: UserConnectionEvent) => {
      handleUserConnect(data);
    });

    socket.on('user:receive:disconnect', (data: UserConnectionEvent) => {
      handleUserDisconnect(data);
    });

    socket.on('user:receive:change_song', (data: SongChangeEvent) => {
      handleUserSongChange(data);
    });

    socket.on('user:receive:status_idle', (data: PlayStatusChangeEvent) => {
      handleUserStatusChange(data);
    });

    socket.on('user:receive:status_playing', (data: PlayStatusChangeEvent) => {
      handleUserStatusChange(data);
    });

    socket.on('user:receive:get_online', (data: CheckOnlineEvent) => {
      handleGetOnlineUsers(data);
    });

    return () => {
      socket.off('user:receive:connect');
      socket.off('user:recieve:disconnect');
      socket.off('user:receive:change_song');
      socket.off('user:receive:status_idle');
      socket.off('user:receive:status_playing');
      socket.off('user:receive:get_online');
    };
  }, [
    handleGetOnlineUsers,
    handleUserConnect,
    handleUserDisconnect,
    handleUserSongChange,
    handleUserStatusChange,
  ]);

  return (
    <UserActivityContainer>
      {activityList
        .filter(
          (user) => user.activity?.status && user.activity?.status !== 'offline'
        )
        .map((user) => (
          <UserActivityItem key={`activity-${user.id}`} user={user} />
        ))}
    </UserActivityContainer>
  );
};
