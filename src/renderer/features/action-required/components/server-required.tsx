import { Text } from '@/renderer/components';

export const ServerRequired = () => {
  return (
    <>
      <Text size="xl">No server selected.</Text>
      <Text>Add or select a server in the file menu.</Text>
    </>
  );
};
