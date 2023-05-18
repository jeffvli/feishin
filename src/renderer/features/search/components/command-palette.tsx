/* eslint-disable react/no-unknown-property */
import { useCallback, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import styled from 'styled-components';
import { GoToCommands } from './go-to-commands';
import { Command, CommandPalettePages } from '/@/renderer/features/search/components/command';
import { Modal } from '/@/renderer/components';
import { HomeCommands } from './home-commands';

interface CommandPaletteProps {
  modalProps: typeof useDisclosure['arguments'];
}

const CustomModal = styled(Modal)`
  & .mantine-Modal-header {
    display: none;
  }
`;

export const CommandPalette = ({ modalProps }: CommandPaletteProps) => {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<CommandPalettePages[]>([CommandPalettePages.HOME]);
  const activePage = pages[pages.length - 1];
  const isHome = activePage === CommandPalettePages.HOME;

  const popPage = useCallback(() => {
    setPages((pages) => {
      const x = [...pages];
      x.splice(-1, 1);
      return x;
    });
  }, []);

  return (
    <CustomModal
      {...modalProps}
      centered
      handlers={{
        ...modalProps.handlers,
        close: () => {
          if (isHome) {
            modalProps.handlers.close();
            setQuery('');
          } else {
            popPage();
          }
        },
        toggle: () => {
          console.log('toggle');
          if (isHome) {
            modalProps.handlers.toggle();
            setQuery('');
          } else {
            popPage();
          }
        },
      }}
    >
      <Command
        filter={(value, search) => {
          if (value.includes(search)) return 1;
          if (value === 'search') return 1;
          return 0;
        }}
        label="Global Command Menu"
        value={value}
        onValueChange={setValue}
      >
        <Command.Input
          autoFocus
          placeholder="Enter your search..."
          value={query}
          onValueChange={setQuery}
        />
        <Command.Separator />
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>

          {activePage === CommandPalettePages.HOME && (
            <HomeCommands
              handleClose={modalProps.handlers.close}
              pages={pages}
              query={query}
              setPages={setPages}
              setQuery={setQuery}
            />
          )}
          {activePage === CommandPalettePages.GO_TO && (
            <GoToCommands
              handleClose={modalProps.handlers.close}
              setPages={setPages}
            />
          )}
        </Command.List>
      </Command>
    </CustomModal>
  );
};
