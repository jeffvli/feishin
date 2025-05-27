import { RiMenuFill } from 'react-icons/ri';

import { AppMenu } from '/@/renderer/features/titlebar/components/app-menu';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Text } from '/@/shared/components/text/text';

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
