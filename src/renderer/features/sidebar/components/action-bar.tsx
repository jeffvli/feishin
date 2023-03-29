import { Grid, Group, TextInput } from '@mantine/core';
import { RiSearchLine, RiMenuFill, RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button, DropdownMenu } from '/@/renderer/components';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { useContainerQuery } from '/@/renderer/hooks';

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

  return (
    <ActionsContainer
      ref={cq.ref}
      gutter="sm"
    >
      <Grid.Col span={cq.isSm ? 7 : 5}>
        <TextInput
          disabled
          readOnly
          icon={<RiSearchLine />}
          placeholder="Search"
          size="md"
        />
      </Grid.Col>
      <Grid.Col span={cq.isSm ? 5 : 7}>
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
