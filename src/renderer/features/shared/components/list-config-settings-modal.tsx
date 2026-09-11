import { ContextModalProps } from '@mantine/modals';

import { ListConfigSettingsForm } from './list-config-settings-form';

import { ListConfigMenuFormProps } from '/@/renderer/features/shared/components/list-config-menu';

export const ListConfigSettingsContextModal = ({
    innerProps,
}: ContextModalProps<ListConfigMenuFormProps>) => {
    return <ListConfigSettingsForm {...innerProps} />;
};
