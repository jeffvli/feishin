import { Text, Box } from '@mantine/core';
import { Link } from 'react-router-dom';

export const AboutContent = () => {
    return (
        <Box
            m={2}
            p={20}
        >
            <Text>Sub-box is an app for DJs. </Text>.
            <Text>
                Find out more here:{' '}
                <Link to="https://www.sub-box.net/">https://www.sub-box.net/</Link>{' '}
            </Text>
        </Box>
    );
};
