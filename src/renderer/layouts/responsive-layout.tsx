import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { DefaultLayout } from '/@/renderer/layouts/default-layout';
import { MobileLayout } from '/@/renderer/layouts/mobile-layout/mobile-layout';

interface ResponsiveLayoutProps {
    shell?: boolean;
}

export const ResponsiveLayout = ({ shell }: ResponsiveLayoutProps) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileLayout shell={shell} />;
    }

    return <DefaultLayout shell={shell} />;
};
