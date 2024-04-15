import { SEPARATOR_STRING } from '/@/renderer/api/utils';
import { Text } from '/@/renderer/components/text';

export const Separator = () => {
    return (
        <Text
            $noSelect
            $secondary
            size="md"
            style={{ display: 'inline-block', padding: '0px 3px' }}
        >
            {SEPARATOR_STRING}
        </Text>
    );
};
