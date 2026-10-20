import { closeModal, openModal } from '@mantine/modals';

import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesVideoStore } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

// Listening along with a friend and being in Group Play (or on a Sour Radio station) both decide what
// plays, and together they kept fixing each other's position. Switching from one to the other asks first.

let asking = 0;
const ask = (title: string, text: string, confirm: string) =>
    new Promise<boolean>((resolve) => {
        const modalId = `sour-switch-${++asking}`;
        let answered = false;
        const done = (yes: boolean) => {
            if (answered) return;
            answered = true;
            closeModal(modalId);
            resolve(yes);
        };
        openModal({
            children: (
                <ConfirmModal
                    labels={{ cancel: 'Stay', confirm }}
                    onCancel={() => done(false)}
                    onConfirm={() => done(true)}
                >
                    <Text>{text}</Text>
                </ConfirmModal>
            ),
            modalId,
            onClose: () => done(false),
            title,
        });
    });

// before joining a group or a station: "Leaving Sam's listen along?"
export const leaveListenAlongFirst = async () => {
    const { listenAlong, listenAlongName, set } = useSourStore.getState();
    if (!listenAlong) return true;
    const name = listenAlongName || 'your friend';
    const yes = await ask(
        `Leaving ${name}'s listen along?`,
        `You're listening along with ${name}. Joining this stops following what they play.`,
        'Leave and join',
    );
    if (yes) set({ listenAlong: null, listenAlongName: null });
    return yes;
};

// before listening along: "Leaving Friday night?" (hosts end the group for everyone)
export const leaveGroupFirst = async () => {
    const { actions, code, hostKey, member, role, state } = useGroupPlayStore.getState();
    if (!code || !state || state.ended) return true;
    const isHost = role === 'host';
    const yes = await ask(
        `Leaving ${state.name || 'Group Play'}?`,
        isHost
            ? 'You host this group, so leaving ends it for everyone.'
            : "You'll stop listening with the group.",
        isHost ? 'End it and leave' : 'Leave',
    );
    if (!yes) return false;
    const url = useHermesVideoStore.getState().url;
    if (isHost && hostKey) await groupApi.end(url, code, hostKey).catch(() => {});
    if (!isHost && member) await groupApi.leave(url, code, member).catch(() => {});
    actions.leave();
    return true;
};

export const startListenAlong = async (friend: {
    id: string;
    name: string;
    tv?: null | { event: string };
}) => {
    if (friend.tv) {
        toast.info({
            message: `${friend.name} is at ${friend.tv.event} on Sour Player TV - you can't listen along to that`,
        });
        return false;
    }
    if (!(await leaveGroupFirst())) return false;
    useSourStore.getState().set({ listenAlong: friend.id, listenAlongName: friend.name });
    return true;
};
