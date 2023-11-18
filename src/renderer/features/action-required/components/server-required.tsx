import { useTranslation } from 'react-i18next';
import { RiMenuFill } from 'react-icons/ri';
import { Button, DropdownMenu, Text } from '/@/renderer/components';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';

export const ServerRequired = () => {
    const { t } = useTranslation();

    return (
        <>
            <Text>No server selected.</Text>
            <DropdownMenu>
                <DropdownMenu.Target>
                    <Button
                        leftIcon={<RiMenuFill />}
                        variant="filled"
                    >
                        {t('common.menu', { postProcess: 'titleCase' })}
                    </Button>
                </DropdownMenu.Target>
                <DropdownMenu.Dropdown>
                    <AppMenu />
                </DropdownMenu.Dropdown>
            </DropdownMenu>
        </>
    );
};
