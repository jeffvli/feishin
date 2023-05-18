import { Grid, Group } from '@mantine/core';
import { RiSearchLine, RiMenuFill, RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button, DropdownMenu, TextInput } from '/@/renderer/components';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCommandPalette } from '/@/renderer/store';

const ActionsContainer = styled(Grid)`
  display: flex;
  align-items: center;
  height: 70px;
  padding: 0 1rem;
  -webkit-app-region: drag;

  input {
    -webkit-app-region: no-drag;
  }
`;

export const ActionBar = () => {
  const cq = useContainerQuery({ sm: 300 });
  const navigate = useNavigate();
  const { open } = useCommandPalette();

  return (
    <ActionsContainer
      ref={cq.ref}
      gutter="sm"
    >
      <Grid.Col span={cq.isSm ? 7 : 6}>
        <TextInput
          readOnly
          icon={<RiSearchLine />}
          placeholder="Search"
          size="md"
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              open();
            }
          }}
        />
      </Grid.Col>
      <Grid.Col span={cq.isSm ? 5 : 6}>
        <Group
          grow
          noWrap
          spacing="sm"
        >
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                p="0.5rem"
                size="md"
                variant="default"
              >
                <RiMenuFill size="1rem" />
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              <AppMenu />
            </DropdownMenu.Dropdown>
          </DropdownMenu>
          <Button
            p="0.5rem"
            size="md"
            variant="default"
            onClick={() => navigate(-1)}
          >
            <RiArrowLeftSLine size="1.5rem" />
          </Button>
          <Button
            p="0.5rem"
            size="md"
            variant="default"
            onClick={() => navigate(1)}
          >
            <RiArrowRightSLine size="1.5rem" />
          </Button>
        </Group>
      </Grid.Col>
    </ActionsContainer>
  );
};
