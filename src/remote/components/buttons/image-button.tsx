import { CiImageOff, CiImageOn } from 'react-icons/ci';

import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { useShowImage, useToggleShowImage } from '/@/remote/store';

export const ImageButton = () => {
    const showImage = useShowImage();
    const toggleImage = useToggleShowImage();

    return (
        <RemoteButton
            mr={5}
            onClick={() => toggleImage()}
            size="xl"
            tooltip={{
                label: showImage ? 'Hide Image' : 'Show Image',
            }}
            variant="default"
        >
            {showImage ? <CiImageOff size={30} /> : <CiImageOn size={30} />}
        </RemoteButton>
    );
};
