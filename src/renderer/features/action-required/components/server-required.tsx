import { RiMenuFill } from 'react-icons/ri';
import { Button, DropdownMenu, Text } from '/@/renderer/components';
import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';

export const ServerRequired = () => {
    return (
        <>
            <Text>No server selected.</Text>
            <DropdownMenu>
                <DropdownMenu.Target>
                    <Button
                        leftSection={<RiMenuFill />}
                        variant="filled"
                    >
                        Open menu
                    </Button>
                </DropdownMenu.Target>
                <DropdownMenu.Dropdown>
                    <AppMenu />
                </DropdownMenu.Dropdown>
            </DropdownMenu>
        </>
    );
};
