import { Title } from '@mantine/core';
import { ServerList } from '../components/ServerList';

export const ServersRoute = () => {
  return (
    <div>
      <Title>Servers</Title>
      <ServerList />
    </div>
  );
};
