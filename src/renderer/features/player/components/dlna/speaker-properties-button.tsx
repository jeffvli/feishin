import isElectron from 'is-electron';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    ListConfigBooleanControl,
    ListConfigTable,
} from '/@/renderer/features/shared/components/list-config-menu';
import { SettingsButton } from '/@/renderer/features/shared/components/settings-button';
import { Paper } from '/@/shared/components/paper/paper';
import { Popover } from '/@/shared/components/popover/popover';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

interface SpeakerProperties {
    bass: number;
    crossfade: boolean;
    ledState: boolean;
    loudness: boolean;
    touchControls: boolean;
    treble: number;
}

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
export const SpeakerPropertiesButton = ({
    deviceId,
    deviceName,
}: {
    deviceId: string;
    deviceName: string;
}) => {
    const { t } = useTranslation();
    const [opened, setOpened] = useState(false);
    const [properties, setProperties] = useState<null | SpeakerProperties>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!opened || !dlnaPlayer) return;
        setLoading(true);
        void dlnaPlayer
            .getSpeakerProperties(deviceId)
            .then(setProperties)
            .catch(() => setProperties(null))
            .finally(() => setLoading(false));
    }, [deviceId, opened]);

    const setProperty = <K extends keyof SpeakerProperties>(
        property: K,
        value: SpeakerProperties[K],
    ) => {
        if (!properties) return;
        setProperties({ ...properties, [property]: value });
        dlnaPlayer?.setSpeakerProperty(deviceId, property, value);
    };

    const sliderOptions = properties
        ? [
              {
                  component: (
                      <Slider
                          max={10}
                          min={-10}
                          onChange={(value) => setProperty('bass', value)}
                          value={properties.bass}
                          w="160px"
                      />
                  ),
                  id: 'bass',
                  label: t('dlna.speakerProperties.bass'),
              },
              {
                  component: (
                      <Slider
                          max={10}
                          min={-10}
                          onChange={(value) => setProperty('treble', value)}
                          value={properties.treble}
                          w="160px"
                      />
                  ),
                  id: 'treble',
                  label: t('dlna.speakerProperties.treble'),
              },
          ]
        : [];
    const toggleOptions = properties
        ? [
              ['loudness', t('dlna.speakerProperties.loudness')],
              ['crossfade', t('dlna.speakerProperties.crossfade')],
              ['ledState', t('dlna.speakerProperties.ledState')],
              ['touchControls', t('dlna.speakerProperties.touchControls')],
          ].map(([property, label]) => ({
              component: (
                  <ListConfigBooleanControl
                      onChange={(value) => setProperty(property as keyof SpeakerProperties, value)}
                      value={properties[property as keyof SpeakerProperties] as boolean}
                  />
              ),
              id: property,
              label,
          }))
        : [];

    return (
        <Popover onChange={setOpened} opened={opened} position="left" withArrow>
            <Popover.Target>
                <span style={{ display: 'inline-flex' }}>
                    <SettingsButton
                        onClick={(event) => {
                            event.stopPropagation();
                            setOpened((current) => !current);
                        }}
                        size="compact-xs"
                        tooltip={{ label: `${t('common.configure')}: ${deviceName}` }}
                    />
                </span>
            </Popover.Target>
            <Popover.Dropdown
                miw={340}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                p="sm"
                style={{ overflowX: 'hidden' }}
            >
                <Stack gap="sm">
                    <Text fw={600} size="sm" ta="center">
                        {deviceName}
                    </Text>
                    {loading && (
                        <Paper p="md" radius="md">
                            <Text c="dimmed" size="xs" ta="center">
                                {t('dlna.speakerProperties.loading')}
                            </Text>
                        </Paper>
                    )}
                    {!loading && !properties && (
                        <Paper p="md" radius="md">
                            <Text c="red" size="xs" ta="center">
                                {t('dlna.speakerProperties.loadFailed')}
                            </Text>
                        </Paper>
                    )}
                    {!loading && properties && (
                        <>
                            <Paper p="md" radius="md">
                                <ListConfigTable options={sliderOptions} />
                            </Paper>
                            <Paper p="md" radius="md">
                                <ListConfigTable options={toggleOptions} />
                            </Paper>
                        </>
                    )}
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};
