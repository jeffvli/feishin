import isElectron from 'is-electron';
import { Group } from '@mantine/core';
import { Select, Tooltip, NumberInput, Switch, Slider } from '/@/renderer/components';
import { SettingsSection } from '/@/renderer/features/settings/components/settings-section';
import {
  SideQueueType,
  useGeneralSettings,
  useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';

const localSettings = isElectron() ? window.electron.localSettings : null;

const SIDE_QUEUE_OPTIONS = [
  { label: 'Fixed', value: 'sideQueue' },
  { label: 'Floating', value: 'sideDrawerQueue' },
];

export const ControlSettings = () => {
  const settings = useGeneralSettings();
  const { setSettings } = useSettingsStoreActions();

  const controlOptions = [
    {
      control: (
        <Switch
          aria-label="Toggle skip buttons"
          defaultChecked={settings.skipButtons?.enabled}
          onChange={(e) =>
            setSettings({
              general: {
                ...settings,
                skipButtons: {
                  ...settings.skipButtons,
                  enabled: e.currentTarget.checked,
                },
              },
            })
          }
        />
      ),
      description: 'Show or hide the skip buttons on the playerbar',
      isHidden: false,
      title: 'Show skip buttons',
    },
    {
      control: (
        <Group>
          <Tooltip label="Backward">
            <NumberInput
              defaultValue={settings.skipButtons.skipBackwardSeconds}
              min={0}
              width={75}
              onBlur={(e) =>
                setSettings({
                  general: {
                    ...settings,
                    skipButtons: {
                      ...settings.skipButtons,
                      skipBackwardSeconds: e.currentTarget.value
                        ? Number(e.currentTarget.value)
                        : 0,
                    },
                  },
                })
              }
            />
          </Tooltip>
          <Tooltip label="Forward">
            <NumberInput
              defaultValue={settings.skipButtons.skipForwardSeconds}
              min={0}
              width={75}
              onBlur={(e) =>
                setSettings({
                  general: {
                    ...settings,
                    skipButtons: {
                      ...settings.skipButtons,
                      skipForwardSeconds: e.currentTarget.value ? Number(e.currentTarget.value) : 0,
                    },
                  },
                })
              }
            />
          </Tooltip>
        </Group>
      ),
      description:
        'The number (in seconds) to skip forward or backward when using the skip buttons',
      isHidden: false,
      title: 'Skip duration',
    },
    {
      control: (
        <Select
          data={[
            { label: 'Now', value: Play.NOW },
            { label: 'Next', value: Play.NEXT },
            { label: 'Last', value: Play.LAST },
          ]}
          defaultValue={settings.playButtonBehavior}
          onChange={(e) =>
            setSettings({
              general: {
                ...settings,
                playButtonBehavior: e as Play,
              },
            })
          }
        />
      ),
      description: 'The default behavior of the play button when adding songs to the queue',
      isHidden: false,
      title: 'Play button behavior',
    },
    {
      control: (
        <Select
          data={SIDE_QUEUE_OPTIONS}
          defaultValue={settings.sideQueueType}
          onChange={(e) => {
            setSettings({
              general: {
                ...settings,
                sideQueueType: e as SideQueueType,
              },
            });
          }}
        />
      ),
      description: 'The style of the sidebar play queue',
      isHidden: false,
      title: 'Side play queue style',
    },
    {
      control: (
        <Switch
          defaultChecked={settings.showQueueDrawerButton}
          onChange={(e) => {
            setSettings({
              general: {
                ...settings,
                showQueueDrawerButton: e.currentTarget.checked,
              },
            });
          }}
        />
      ),
      description: 'Display a hover icon on the right side of the application view the play queue',
      isHidden: false,
      title: 'Show floating queue hover area',
    },
    {
      control: (
        <Slider
          defaultValue={settings.volumeWheelStep}
          max={20}
          min={1}
          w={100}
          onChangeEnd={(e) => {
            setSettings({
              general: {
                ...settings,
                volumeWheelStep: e,
              },
            });
          }}
        />
      ),
      description:
        'The amount of volume to change when scrolling the mouse wheel on the volume slider',
      isHidden: false,
      title: 'Volume wheel step',
    },
    {
      control: (
        <Switch
          defaultChecked={settings.resume}
          onChange={(e) => {
            localSettings?.set('resume', e.target.checked);
            setSettings({
              general: {
                ...settings,
                resume: e.currentTarget.checked,
              },
            });
          }}
        />
      ),
      description: 'When exiting, save the current play queue and restore it when reopening',
      isHidden: !isElectron(),
      title: 'Save queue state on close',
    },
  ];

  return <SettingsSection options={controlOptions} />;
};
