import { PostProcessorModule } from 'i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
const en = require('./locales/en.json');

const resources = {
    en: { translation: en },
};

export const Languages = [
    {
        label: 'English',
        value: 'en',
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
        return value.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
        });
    },
};

const sentenceCasePostProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'sentenceCase',
    process: (value: string) => {
        const sentences = value.split('. ');

        return sentences
            .map((sentence) => {
                return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLocaleLowerCase();
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
        lng: 'en',
        resources,
    });

export default i18n;
