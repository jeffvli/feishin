const RTL_REGEX = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}]/u;

export const testRtl = (text: string): boolean => RTL_REGEX.test(text);
