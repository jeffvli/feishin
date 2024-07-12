import { AboutContent } from '/@/renderer/features/about/components/about-content';
import { AboutHeader } from '/@/renderer/features/about/components/about-header';
import { AnimatedPage } from '/@/renderer/features/shared';

const AboutRoute = () => {
    return (
        <AnimatedPage>
            <AboutHeader />
            <AboutContent />
        </AnimatedPage>
    );
};

export default AboutRoute;
