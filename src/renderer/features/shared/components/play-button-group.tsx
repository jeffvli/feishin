import i18n from '/@/i18n/i18n';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { AppIconSelection } from '/@/shared/components/icon/icon';
import { Play } from '/@/shared/types/types';

const playButtons: { icon: AppIconSelection; label: string; type: Play }[] = [
    {
        icon: 'mediaPlay',
        label: i18n.t('player.play', { postProcess: 'sentenceCase' }),
        type: Play.NOW,
    },
    {
        icon: 'mediaPlayNext',
        label: i18n.t('player.addNext', { postProcess: 'sentenceCase' }),
        type: Play.NEXT,
    },
    {
        icon: 'mediaPlayLast',
        label: i18n.t('player.addLast', { postProcess: 'sentenceCase' }),
        type: Play.LAST,
    },
    {
        icon: 'mediaShuffle',
        label: i18n.t('player.shuffle', { postProcess: 'sentenceCase' }),
        type: Play.SHUFFLE,
    },
];

interface PlayButtonGroupProps {
    onPlay: (type: Play) => void;
}

export const PlayButtonGroup = ({ onPlay }: PlayButtonGroupProps) => {
    return (
        <Group grow>
            {playButtons.map((button) => (
                <ActionIcon
                    icon={button.icon}
                    iconProps={{
                        size: 'xl',
                    }}
                    key={button.type}
                    onClick={() => onPlay(button.type)}
                    styles={{
                        root: {
                            padding: 'var(--mantine-spacing-lg)',
                        },
                    }}
                    tooltip={{
                        label: button.label,
                        openDelay: 0,
                    }}
                    variant="default"
                />
            ))}
        </Group>
    );
};
