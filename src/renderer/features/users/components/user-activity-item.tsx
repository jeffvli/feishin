import React from 'react';
import { Avatar, Group, Indicator, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { IoIosPause } from 'react-icons/io';
import { RiPlayFill, RiServerLine, RiUserLine } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { User } from '@/renderer/api/types';
import { Popover, Text } from '@/renderer/components';
import { useServerMap } from '@/renderer/features/servers';
import { AppRoute } from '@/renderer/router/routes';
import { titleCase } from '../../../utils/title-case';

export type Activity = {
  socketId?: string;
  song?: {
    album?: string;
    albumArtists: { id: string; name: string }[];
    albumId?: string;
    id: string;
    name: string;
    serverId: string;
  };
  status?: 'playing' | 'idle' | 'offline';
};

export type UserWithActivity = User & {
  activity?: Activity;
  avatarUrl?: string;
};

interface UserActivityItemProps {
  user: UserWithActivity;
}

const ActivityContainer = styled(motion.div)`
  padding: 0.5rem;
`;

const ItemGrid = styled.div`
  display: grid;
  grid-auto-columns: 1fr;
  grid-template-areas: 'image info';
  grid-template-rows: 1fr;
  grid-template-columns: 50px minmax(0, 1fr);
`;

const ItemImageContainer = styled.div`
  display: flex;
  grid-area: image;
  align-items: center;
`;

const ItemInfoContainer = styled.div`
  grid-area: info;
`;

export const UserActivityItem = ({ user }: UserActivityItemProps) => {
  const { data: serverMap } = useServerMap();
  const [opened, { close, open }] = useDisclosure(false);

  const displayedName = user?.displayName
    ? `${user.displayName} (${user.username})`
    : user.username;
  const songName = user?.activity?.song?.name;
  const songId = user?.activity?.song?.id;
  const albumId = user?.activity?.song?.albumId;
  const albumName = user?.activity?.song?.album;
  const serverId = user?.activity?.song?.serverId;
  const status = user?.activity?.status;
  const albumArtists = user?.activity?.song?.albumArtists;

  console.log('serverMap', serverMap);

  console.log('serverId', serverId);

  return (
    <ActivityContainer>
      <ItemGrid>
        <ItemImageContainer>
          <Popover opened={opened} position="top-start">
            <Popover.Target>
              <Indicator
                color="green"
                offset={5}
                position="bottom-end"
                onMouseEnter={open}
                onMouseLeave={close}
              >
                <Avatar radius="xl" size={40} src={user?.avatarUrl} />
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack spacing={5}>
                <Group />
                {serverId && <Group />}
              </Stack>
              <Stack spacing={5}>
                <Group>
                  <RiUserLine /> {displayedName}
                </Group>
                {serverId && (
                  <Group>
                    <RiServerLine /> {serverMap?.data[serverId]?.name} (
                    {titleCase(serverMap?.data[serverId]?.type || '')})
                  </Group>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </ItemImageContainer>
        <ItemInfoContainer>
          <Group noWrap position="apart">
            <Stack spacing={0} sx={{ lineHeight: 1, maxWidth: '80%' }}>
              <Text overflow="hidden" size="sm">
                {songId ? songName : 'Idle...'}
              </Text>
              <Text $secondary overflow="hidden" size="xs">
                {albumArtists?.length ? (
                  albumArtists.map((artist, index) => (
                    <React.Fragment
                      key={`activity-${user.id}-artist-${artist.id}`}
                    >
                      {index > 0 ? ', ' : null}
                      <Text
                        $link
                        $secondary
                        component={Link}
                        overflow="hidden"
                        size="xs"
                        sx={{ width: 'fit-content' }}
                        to={generatePath(AppRoute.LIBRARY_ALBUMARTISTS_DETAIL, {
                          albumArtistId: artist.id,
                        })}
                      >
                        {artist.name}
                      </Text>
                    </React.Fragment>
                  ))
                ) : (
                  <Text $secondary>—</Text>
                )}
              </Text>
              {albumId ? (
                <Text
                  $link
                  $secondary
                  component={Link}
                  overflow="hidden"
                  size="xs"
                  sx={{ width: 'fit-content' }}
                  to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                    albumId,
                  })}
                >
                  {albumName}
                </Text>
              ) : (
                <Text $secondary overflow="hidden" size="xs">
                  —
                </Text>
              )}
            </Stack>
            <Group>
              {status === 'playing' ? (
                <RiPlayFill color="var(--main-fg)" size={15} />
              ) : (
                <IoIosPause color="var(--main-fg)" size={15} />
              )}
            </Group>
          </Group>
        </ItemInfoContainer>
      </ItemGrid>
    </ActivityContainer>
  );
};
