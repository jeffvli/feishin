import axios from 'axios';

export const translateLyrics = async (
    originalLyrics: string,
    apiKey: string,
    apiProvider: string | null,
    targetLanguage: string | null,
) => {
    let TranslatedText = '';
    if (apiProvider === 'Microsoft Azure') {
        try {
            const response = await axios({
                data: [
                    {
                        Text: originalLyrics,
                    },
                ],
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': apiKey,
                },
                method: 'post',
                url: `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLanguage as string}`,
            });
            TranslatedText = response.data[0].translations[0].text;
        } catch (e) {
            console.error('Microsoft Azure translate request got an error!', e);
            return null;
        }
    } else if (apiProvider === 'Google Cloud') {
        try {
            const response = await axios({
                data: {
                    format: 'text',
                    q: originalLyrics,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'post',
                url: `https://translation.googleapis.com/language/translate/v2?target=${targetLanguage as string}&key=${apiKey}`,
            });
            TranslatedText = response.data.data.translations[0].translatedText;
        } catch (e) {
            console.error('Google Cloud translate request got an error!', e);
            return null;
        }
    }
    return TranslatedText;
};
