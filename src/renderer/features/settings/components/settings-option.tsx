import React from 'react';
import { Group, Stack } from '@mantine/core';
import { RiInformationLine } from 'react-icons/ri';
import { Text, Tooltip } from '/@/renderer/components';

interface SettingsOptionProps {
  control: React.ReactNode;
  description?: React.ReactNode | string;
  note?: string;
  title: React.ReactNode | string;
}

export const SettingsOptions = ({ title, description, control, note }: SettingsOptionProps) => {
  return (
    <>
      <Group
        noWrap
        position="apart"
        sx={{ alignItems: 'center' }}
      >
        <Stack
          spacing="xs"
          sx={{
            alignSelf: 'flex-start',
            display: 'flex',
            maxWidth: '50%',
          }}
        >
          <Group>
            <Text
              $noSelect
              size="md"
            >
              {title}
            </Text>
            {note && (
              <Tooltip
                label={note}
                openDelay={0}
              >
                <Group>
                  <RiInformationLine size={15} />
                </Group>
              </Tooltip>
            )}
          </Group>
          {React.isValidElement(description) ? (
            description
          ) : (
            <Text
              $noSelect
              $secondary
              size="sm"
            >
              {description}
            </Text>
          )}
        </Stack>
        <Group position="right">{control}</Group>
      </Group>
    </>
  );
};

SettingsOptions.defaultProps = {
  description: undefined,
  note: undefined,
};
