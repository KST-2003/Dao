import { router } from 'expo-router';
import { useState } from 'react';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useAuthStore } from '@/shared/store/authStore';
import { useMe, useUpdateProfile } from '../api';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function useProfileSetupScreen() {
  const me = useMe();
  const update = useUpdateProfile();
  const clearNewUser = useAuthStore((s) => s.clearNewUser);
  const message = useErrorMessage();
  const [name, setName] = useState(me.data?.display_name ?? me.data?.name ?? '');
  const [birthday, setBirthday] = useState(me.data?.date_of_birth ?? '');

  const done = () => {
    clearNewUser();
    router.dismissAll();
  };

  const save = () => {
    update.mutate(
      { display_name: name.trim() || null, name: me.data?.name ?? (name.trim() || null), date_of_birth: DATE.test(birthday) ? birthday : null },
      { onSuccess: done },
    );
  };

  return {
    name,
    setName,
    birthday,
    setBirthday,
    birthdayInvalid: birthday !== '' && !DATE.test(birthday),
    save,
    skip: done,
    saving: update.isPending,
    error: update.error ? message(update.error) : undefined,
  };
}
