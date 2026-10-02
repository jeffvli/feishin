import { closeModal, openModal } from '@mantine/modals';
import { t } from 'i18next';
import isElectron from 'is-electron';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Group } from '/@/shared/components/group/group';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const ADMIN_ACCESS_MODAL_ID = 'administrator-access';
const ADMIN_PASSWORD_CHANGE_MODAL_ID = 'administrator-password-change';

const localSettings = isElectron() ? window.api.localSettings : null;

interface AdministratorAccessFormProps {
    onCancel?: () => void;
    onSuccess: () => void;
}

const AdministratorPasswordChangeForm = () => {
    const { t } = useTranslation();
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError(t('setting.adminLockPasswordMismatch'));
            return;
        }

        if (newPassword.length < 6 || newPassword.length > 128) {
            setError(t('setting.adminLockPasswordRequirements'));
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await localSettings?.adminPasswordChange(currentPassword, newPassword);

            if (!success) {
                setError(t('setting.adminLockInvalidCurrentPassword'));
                return;
            }

            closeModal(ADMIN_PASSWORD_CHANGE_MODAL_ID);
            toast.success({ message: t('setting.adminLockPasswordChanged') });
        } catch {
            setError(t('setting.adminLockUnavailable'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <Stack gap="md">
                <Text>{t('setting.adminLockChangeDescription')}</Text>
                <PasswordInput
                    autoFocus
                    label={t('setting.adminLockCurrentPassword')}
                    maxLength={128}
                    minLength={6}
                    onChange={(event) => setCurrentPassword(event.currentTarget.value)}
                    required
                    value={currentPassword}
                />
                <PasswordInput
                    error={error || undefined}
                    label={t('setting.adminLockNewPassword')}
                    maxLength={128}
                    minLength={6}
                    onChange={(event) => setNewPassword(event.currentTarget.value)}
                    required
                    value={newPassword}
                />
                <PasswordInput
                    label={t('setting.adminLockConfirmNewPassword')}
                    maxLength={128}
                    minLength={6}
                    onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                    required
                    value={confirmPassword}
                />
                <Group justify="flex-end">
                    <ModalButton
                        onClick={() => closeModal(ADMIN_PASSWORD_CHANGE_MODAL_ID)}
                        variant="subtle"
                    >
                        {t('common.cancel')}
                    </ModalButton>
                    <ModalButton loading={isSubmitting} type="submit" variant="filled">
                        {t('setting.adminLockChangePassword')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};

const AdministratorAccessForm = ({ onCancel, onSuccess }: AdministratorAccessFormProps) => {
    const { t } = useTranslation();
    const [configured, setConfigured] = useState<boolean>();
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [password, setPassword] = useState('');

    useEffect(() => {
        localSettings
            ?.adminPasswordIsSet()
            .then(setConfigured)
            .catch(() => setError(t('setting.adminLockUnavailable')));
    }, [t]);

    const cancel = () => {
        closeModal(ADMIN_ACCESS_MODAL_ID);
        onCancel?.();
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (!configured && password !== confirmPassword) {
            setError(t('setting.adminLockPasswordMismatch'));
            return;
        }

        setIsSubmitting(true);
        try {
            const success = configured
                ? await localSettings?.adminPasswordVerify(password)
                : await localSettings?.adminPasswordSet(password);

            if (!success) {
                setError(
                    configured
                        ? t('setting.adminLockInvalidPassword')
                        : t('setting.adminLockPasswordRequirements'),
                );
                return;
            }

            closeModal(ADMIN_ACCESS_MODAL_ID);
            onSuccess();
        } catch {
            setError(t('setting.adminLockUnavailable'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (configured === undefined && !error) {
        return <Spinner container />;
    }

    return (
        <form onSubmit={submit}>
            <Stack gap="md">
                <Text>
                    {configured
                        ? t('setting.adminLockUnlockDescription')
                        : t('setting.adminLockSetupDescription')}
                </Text>
                <PasswordInput
                    autoFocus
                    error={error || undefined}
                    label={t('setting.adminLockPassword')}
                    maxLength={128}
                    minLength={6}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    required
                    value={password}
                />
                {!configured && (
                    <PasswordInput
                        label={t('setting.adminLockConfirmPassword')}
                        maxLength={128}
                        minLength={6}
                        onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                        required
                        value={confirmPassword}
                    />
                )}
                <Group justify="flex-end">
                    <ModalButton onClick={cancel} variant="subtle">
                        {t('common.cancel')}
                    </ModalButton>
                    <ModalButton loading={isSubmitting} type="submit" variant="filled">
                        {configured
                            ? t('setting.adminLockUnlock')
                            : t('setting.adminLockSetPassword')}
                    </ModalButton>
                </Group>
            </Stack>
        </form>
    );
};

export const requestAdministratorAccess = (onSuccess: () => void, onCancel?: () => void) => {
    if (!localSettings) {
        onSuccess();
        return;
    }

    openModal({
        children: <AdministratorAccessForm onCancel={onCancel} onSuccess={onSuccess} />,
        closeOnClickOutside: false,
        closeOnEscape: false,
        modalId: ADMIN_ACCESS_MODAL_ID,
        title: t('setting.adminLockTitle'),
        withCloseButton: false,
    });
};

export const openAdministratorPasswordChangeModal = () => {
    if (!localSettings) return;

    openModal({
        children: <AdministratorPasswordChangeForm />,
        closeOnClickOutside: false,
        modalId: ADMIN_PASSWORD_CHANGE_MODAL_ID,
        title: t('setting.adminLockChangeTitle'),
    });
};
