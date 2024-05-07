import { PostProcessorModule, TOptions, StringMap } from 'i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import pl from './locales/pl.json';
import zhHans from './locales/zh-Hans.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import ptBr from './locales/pt-BR.json';
import sr from './locales/sr.json';
import sv from './locales/sv.json';
import cs from './locales/cs.json';
import nbNO from './locales/nb-NO.json';
import nl from './locales/nl.json';
import zhHant from './locales/zh-Hant.json';
import fa from './locales/fa.json';

const resources = {
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
    it: { translation: it },
    ru: { translation: ru },
    'pt-BR': { translation: ptBr },
    fa: { translation: fa },
    fr: { translation: fr },
    ja: { translation: ja },
    pl: { translation: pl },
    'zh-Hans': { translation: zhHans },
    'zh-Hant': { translation: zhHant },
    sr: { translation: sr },
    sv: { translation: sv },
    cs: { translation: cs },
    nl: { translation: nl },
    'nb-NO': { translation: nbNO },
};

export const languages = [
    {
        label: 'English',
        value: 'en',
    },
    {
        label: 'Čeština',
        value: 'cs',
    },
    {
        label: 'Español',
        value: 'es',
    },
    {
        label: 'Deutsch',
        value: 'de',
    },
    {
        label: 'Français',
        value: 'fr',
    },
    {
        label: 'Italiano',
        value: 'it',
    },
    {
        label: '日本語',
        value: 'ja',
    },
    {
        label: 'Nederlands',
        value: 'nl',
    },
    {
        label: 'Norsk (Bokmål)',
        value: 'nb-NO',
    },
    {
        label: 'فارسی',
        value: 'fa',
    },
    {
        label: 'Português (Brasil)',
        value: 'pt-BR',
    },
    {
        label: 'Polski',
        value: 'pl',
    },
    {
        label: 'Русский',
        value: 'ru',
    },
    {
        label: 'Srpski',
        value: 'sr',
    },
    {
        label: 'Svenska',
        value: 'sv',
    },
    {
        label: '简体中文',
        value: 'zh-Hans',
    },
    {
        label: '繁體中文',
        value: 'zh-Hant',
    },
];

const lowerCasePostProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'lowerCase',
    process: (value: string) => {
        return value.toLocaleLowerCase();
    },
};

const upperCasePostProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'upperCase',
    process: (value: string) => {
        return value.toLocaleUpperCase();
    },
};

const titleCasePostProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'titleCase',
    process: (value: string) => {
        return value.replace(/\S\S*/g, (txt) => {
            return txt.charAt(0).toLocaleUpperCase() + txt.slice(1).toLowerCase();
        });
    },
};

const ignoreSentenceCaseLanguages = ['de'];

const sentenceCasePostProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'sentenceCase',
    process: (value: string, _key: string, _options: TOptions<StringMap>, translator: any) => {
        const sentences = value.split('. ');

        return sentences
            .map((sentence) => {
                return (
                    sentence.charAt(0).toLocaleUpperCase() +
                    (!ignoreSentenceCaseLanguages.includes(translator.language)
                        ? sentence.slice(1).toLocaleLowerCase()
                        : sentence.slice(1))
                );
            })
            .join('. ');
    },
};
i18n.use(lowerCasePostProcessor)
    .use(upperCasePostProcessor)
    .use(titleCasePostProcessor)
    .use(sentenceCasePostProcessor)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        fallbackLng: 'en',
        // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
        // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
        // if you're using a language detector, do not define the lng option
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        resources,
    });

export default i18n;
