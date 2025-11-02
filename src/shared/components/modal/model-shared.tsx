import { Button, ButtonProps } from '/@/shared/components/button/button';

export const ModalButton = ({ children, ...props }: ButtonProps) => {
    return (
        <Button px="2xl" uppercase variant="subtle" {...props}>
            {children}
        </Button>
    );
};
