import { useAckedAction } from '/@/remote/hooks/use-acked-action';
import { useConfirmedSend } from '/@/remote/hooks/use-confirmed-send';
import { Button } from '/@/shared/components/button/button';
import { Icon } from '/@/shared/components/icon/icon';

export const ClearQueueButton = () => {
    const confirmedSend = useConfirmedSend();
    const { pendingKey, run } = useAckedAction();
    const isPending = pendingKey === 'clear-queue';

    return (
        <Button
            fullWidth
            leftSection={<Icon icon="delete" />}
            loading={isPending}
            onClick={() => run('clear-queue', confirmedSend({ event: 'clear-queue' }), () => {})}
            variant="default"
        >
            Clear Queue
        </Button>
    );
};
