import { Text, Box } from '@mantine/core';
import { Link } from 'react-router-dom';

export const AboutContent = () => {
    return (
        <Box
            m={2}
            p={20}
        >
            <Text>Sub-box is an app for DJs and a music player for listeners. </Text>
            <Text>Listeners can browse mixes <Link to="/library/mixes"> here</Link>. </Text>
            <Text>To upload your private music collection to sub-box. Sign up at <Link to="https://www.sub-box.net/">https://www.sub-box.net/</Link></Text>
        </Box>
    );
};
