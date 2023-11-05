import { CiImageOff, CiImageOn } from 'react-icons/ci';
import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { useShowImage, useToggleShowImage } from '/@/remote/store';

export const ImageButton = () => {
    const showImage = useShowImage();
    const toggleImage = useToggleShowImage();

    return (
        <RemoteButton
            tooltip={showImage ? 'Hide Image' : 'Show Image'}
            onClick={() => toggleImage()}
        >
            {showImage ? <CiImageOff size={30} /> : <CiImageOn size={30} />}
        </RemoteButton>
    );
};
