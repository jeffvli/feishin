import { createContext, useContext } from 'react';

export const SettingSearchContext = createContext<string>('');

export const useSettingSearchContext = () => {
    const ctxValue = useContext(SettingSearchContext);
    return ctxValue;
};
