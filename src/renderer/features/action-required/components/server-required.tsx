import { openContextModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { Button, ContextModalVars } from '/@/renderer/components';
import { AddServerForm } from '/@/renderer/features/servers';

export const LogonRequired = () => {
    const { t } = useTranslation();
    const handleAddServerModal = () => {
        openContextModal({
            innerProps: {
                // eslint-disable-next-line react/no-unstable-nested-components
                modalBody: (vars: ContextModalVars) => (
                    <AddServerForm onCancel={() => vars.context.closeModal(vars.id)} />
                ),
            },
            modal: 'base',
            title: t('form.logon.title', { postProcess: 'titleCase' }),
        });
    };

    return (
        <>
            <Button
                variant="filled"
                onClick={handleAddServerModal}
            >
                Log On.
            </Button>
        </>
    );
};
