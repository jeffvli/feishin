import isElectron from 'is-electron';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Group } from '/@/shared/components/group/group';
import { Switch } from '/@/shared/components/switch/switch';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';

const localSettings = isElectron() ? window.api.localSettings : null;

export function IgnoreCorsSslSwitches() {
    const { t } = useTranslation();

    const [ignoreCORS, setIgnoreCORS] = useLocalStorage({
        defaultValue: 'false',
        key: 'ignore_cors',
    });
    const [ignoreSSL, setIgnoreSSL] = useLocalStorage({
        defaultValue: 'false',
        key: 'ignore_ssl',
    });

    const handleUpdateIgnoreCORS = (e: ChangeEvent<HTMLInputElement>) => {
        setIgnoreCORS(String(e.currentTarget.checked));
        localSettings?.set('ignore_cors', e.currentTarget.checked);
    };

    const handleUpdateIgnoreSSL = (e: ChangeEvent<HTMLInputElement>) => {
        setIgnoreSSL(String(e.currentTarget.checked));
        localSettings?.set('ignore_ssl', e.currentTarget.checked);
    };

    if (!isElectron()) {
        return null;
    }

    return (
        <>
            <Group>
                <Switch
                    checked={ignoreCORS === 'true'}
                    label={t('form.addServer.ignoreCors', {
                        postProcess: 'sentenceCase',
                    })}
                    onChange={handleUpdateIgnoreCORS}
                />
            </Group>
            <Group>
                <Switch
                    checked={ignoreSSL === 'true'}
                    label={t('form.addServer.ignoreSsl', {
                        postProcess: 'sentenceCase',
                    })}
                    onChange={handleUpdateIgnoreSSL}
                />
            </Group>
        </>
    );
}
