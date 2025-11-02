import { SettingsState } from '/@/renderer/store';
import { Box } from '/@/shared/components/box/box';
import { Text } from '/@/shared/components/text/text';

interface DiffVisualiserProps {
    newSettings: Omit<SettingsState, 'actions'>;
    originalSettings: Omit<SettingsState, 'actions'>;
}

const diff = (newSettings: SettingsState, originalSettings: SettingsState) => {
    const diffs: string[] = [];

    const newSettingsString = JSON.stringify(newSettings, null, 2);
    const originalSettingsString = JSON.stringify(originalSettings, null, 2);

    const newSettingsLines = newSettingsString.split('\n');
    const originalSettingsLines = originalSettingsString.split('\n');

    originalSettingsLines.forEach((line, index) => {
        if (line !== newSettingsLines[index]) {
            diffs.push(`- ${line}`);
            if (newSettingsLines[index] !== undefined) {
                diffs.push(`+ ${newSettingsLines[index]}`);
            }
        } else {
            diffs.push(`  ${line}`);
        }
    });

    return diffs;
};

export const DiffVisualiser = ({ newSettings, originalSettings }: DiffVisualiserProps) => {
    const differences = diff(newSettings, originalSettings);

    return (
        <Box
            mah="400px"
            p="md"
            style={{ fontFamily: 'monospace', overflow: 'auto', whiteSpace: 'pre-wrap' }}
        >
            {differences.map((line, index) => (
                <Text
                    key={index}
                    style={{
                        color: line.startsWith('+')
                            ? 'green'
                            : line.startsWith('-')
                              ? 'red'
                              : 'white',
                    }}
                >
                    {line}
                </Text>
            ))}
        </Box>
    );
};
