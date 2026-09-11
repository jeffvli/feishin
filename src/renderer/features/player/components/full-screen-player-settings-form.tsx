import { useTranslation } from 'react-i18next';

import { FullscreenPlayerSettings } from '/@/renderer/features/settings/components/general/fullscreen-player-settings';
import {
    ListConfigBooleanControl,
    ListConfigTable,
} from '/@/renderer/features/shared/components/list-config-menu';
import {
    PlayerItem,
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useGeneralSettings,
} from '/@/renderer/store';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';

export const FullScreenPlayerSettingsForm = () => {
    const { t } = useTranslation();
    const {
        coverArtSize,
        dynamicBackground,
        dynamicImageBlur,
        dynamicIsImage,
        opacity,
        playerItemAlignment,
        titleDisplayType,
        titleLineCount,
        useImageAspectRatio,
    } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { playerItems } = useGeneralSettings();

    const isTitleEnabled = !playerItems.find((item) => item.id === PlayerItem.TITLE)?.disabled;

    const playerOptions = [
        {
            component: (
                <ListConfigBooleanControl
                    onChange={(value) => setStore({ dynamicBackground: value })}
                    value={!!dynamicBackground}
                />
            ),
            id: 'dynamicBackground',
            label: t('page.fullscreenPlayer.config.dynamicBackground'),
        },
        {
            component: (
                <ListConfigBooleanControl
                    onChange={(value) => setStore({ dynamicIsImage: value })}
                    value={!!dynamicIsImage}
                />
            ),
            id: 'dynamicIsImage',
            isHidden: !dynamicBackground,
            label: t('page.fullscreenPlayer.config.dynamicIsImage'),
        },
        {
            component: (
                <Slider
                    defaultValue={dynamicImageBlur}
                    label={(value) => `${value} rem`}
                    marks={[
                        { label: '1.5', value: 1.5 },
                        { label: '3.0', value: 3 },
                        { label: '4.5', value: 4.5 },
                    ]}
                    max={6}
                    min={0}
                    onChangeEnd={(value) => setStore({ dynamicImageBlur: Number(value) })}
                    step={0.5}
                    w="50%"
                />
            ),
            id: 'dynamicImageBlur',
            isHidden: !(dynamicBackground && dynamicIsImage),
            label: t('page.fullscreenPlayer.config.dynamicImageBlur'),
        },
        {
            component: (
                <Slider
                    defaultValue={opacity}
                    label={(value) => `${value} %`}
                    marks={[
                        { label: '25%', value: 25 },
                        { label: '50%', value: 50 },
                        { label: '75%', value: 75 },
                    ]}
                    max={100}
                    min={0}
                    onChangeEnd={(value) => setStore({ opacity: Number(value) })}
                    w="50%"
                />
            ),
            id: 'opacity',
            isHidden: !dynamicBackground,
            label: t('page.fullscreenPlayer.config.opacity'),
        },
        {
            component: (
                <ListConfigBooleanControl
                    onChange={(value) => setStore({ useImageAspectRatio: value })}
                    value={useImageAspectRatio}
                />
            ),
            id: 'useImageAspectRatio',
            label: t('page.fullscreenPlayer.config.useImageAspectRatio'),
        },
        {
            component: (
                <Slider
                    defaultValue={coverArtSize}
                    label={(value) => `${value}px`}
                    marks={[
                        { label: '60px', value: 60 },
                        { label: '80px', value: 80 },
                        { label: '100px', value: 100 },
                    ]}
                    max={100}
                    min={55}
                    onChangeEnd={(value) => setStore({ coverArtSize: Number(value) })}
                    w="50%"
                />
            ),
            id: 'coverArtSize',
            label: t('page.fullscreenPlayer.config.coverArtSize'),
        },
        {
            component: (
                <SegmentedControl
                    data={[
                        { label: t('common.left'), value: 'left' },
                        { label: t('common.center'), value: 'center' },
                        { label: t('common.right'), value: 'right' },
                    ]}
                    onChange={(value) =>
                        setStore({ playerItemAlignment: value as 'center' | 'left' | 'right' })
                    }
                    value={playerItemAlignment}
                    w="100%"
                />
            ),
            id: 'playerItemAlignment',
            label: t('page.fullscreenPlayer.config.playerItemAlignment'),
        },
        {
            component: (
                <Select
                    data={[
                        {
                            label: t('page.fullscreenPlayer.config.titleDisplayType', {
                                context: 'optionMultiLine',
                            }),
                            value: 'multiLine',
                        },
                        {
                            label: t('page.fullscreenPlayer.config.titleDisplayType', {
                                context: 'optionScroll',
                            }),
                            value: 'scroll',
                        },
                    ]}
                    onChange={(value) =>
                        setStore({ titleDisplayType: value as 'multiLine' | 'scroll' })
                    }
                    value={titleDisplayType}
                    width="100%"
                />
            ),
            id: 'titleDisplayType',
            isHidden: !isTitleEnabled,
            label: t('page.fullscreenPlayer.config.titleDisplayType'),
        },
        {
            component: (
                <NumberInput
                    defaultValue={titleLineCount}
                    hideControls={false}
                    max={10}
                    min={1}
                    onBlur={(e) => setStore({ titleLineCount: Number(e.currentTarget.value) })}
                    step={1}
                    width={100}
                />
            ),
            id: 'titleLineCount',
            isHidden: !(isTitleEnabled && titleDisplayType === 'multiLine'),
            label: t('page.fullscreenPlayer.config.titleLineCount'),
        },
    ];

    return (
        <Stack>
            <Fieldset p="md">
                <ListConfigTable options={playerOptions} />
            </Fieldset>
            <Fieldset p="md">
                <FullscreenPlayerSettings showDescription={false} />
            </Fieldset>
        </Stack>
    );
};
