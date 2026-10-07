import { GroupPlayPanel } from '/@/renderer/features/group-play/components/group-play-panel';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Drawer } from '/@/shared/components/drawer/drawer';

// Group Play opens as a side panel, so you can browse and add songs while it stays open.
export const GroupPlayDrawer = () => {
    const open = useGroupPlayStore((s) => s.panelOpen);
    return (
        <Drawer
            closeOnClickOutside={false}
            lockScroll={false}
            onClose={() => useGroupPlayStore.setState({ panelOpen: false })}
            opened={open}
            position="right"
            size={460}
            title="Group Play"
            withOverlay={false}
        >
            <GroupPlayPanel />
        </Drawer>
    );
};

export const GroupPlayButton = () => {
    const code = useGroupPlayStore((state) => state.code);
    const listening = useGroupPlayStore((state) => {
        const people = new Set((state.state?.members ?? []).map((m) => m.profile || m.name));
        return people.size + (state.state?.radio ? 0 : 1);
    });
    const label = code ? `Group Play (${code}) - ${listening} listening` : 'Group Play';

    return (
        <ActionIcon
            icon="groupPlay"
            iconProps={{ color: code ? 'primary' : undefined, size: 'lg' }}
            onClick={(e) => {
                e.stopPropagation();
                useGroupPlayStore.setState((s) => ({ panelOpen: !s.panelOpen }));
            }}
            size="sm"
            tooltip={{ label, openDelay: 0 }}
            variant="subtle"
        />
    );
};
