import { getCamelotKeyColor } from '/@/renderer/utils/camelot-key';
import { Badge } from '/@/shared/components/badge/badge';

/** A Camelot key in its color on the wheel. Values that are not Camelot keys get a plain badge. */
export const CamelotKeyBadge = ({ camelotKey }: { camelotKey: string }) => {
    const color = getCamelotKeyColor(camelotKey);

    return (
        <Badge style={color ? { backgroundColor: color, color: 'black' } : undefined}>
            {camelotKey}
        </Badge>
    );
};
