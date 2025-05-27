import type { MantineColorsTuple, MantineThemeOverride } from '@mantine/core';

import { generateColors } from '@mantine/colors-generator';
import { createTheme, rem } from '@mantine/core';
import merge from 'lodash/merge';

import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

// const lightColors: MantineColorsTuple = [
//     '#f5f5f5',
//     '#e7e7e7',
//     '#cdcdcd',
//     '#b2b2b2',
//     '#9a9a9a',
//     '#8b8b8b',
//     '#848484',
//     '#717171',
//     '#656565',
//     '#575757',
// ];

const darkColors: MantineColorsTuple = [
    '#C9C9C9',
    '#b8b8b8',
    '#828282',
    '#696969',
    '#424242',
    '#3b3b3b',
    '#242424',
    '#181818',
    '#1f1f21',
    '#141414',
];

const mantineTheme: MantineThemeOverride = createTheme({
    autoContrast: true,
    breakpoints: {
        '2xl': '120em',
        '3xl': '160em',
        lg: '75em',
        md: '62em',
        sm: '48em',
        xl: '88em',
        xs: '36em',
    },
    cursorType: 'pointer',
    defaultRadius: 'sm',
    focusRing: 'never',
    fontFamily: 'var(--theme-content-font-family)',
    fontSizes: {
        '2xl': rem('20px'),
        '3xl': rem('24px'),
        '4xl': rem('28px'),
        '5xl': rem('32px'),
        lg: rem('16px'),
        md: rem('13px'),
        sm: rem('12px'),
        xl: rem('18px'),
        xs: rem('10px'),
    },
    fontSmoothing: true,
    headings: {
        fontFamily: 'var(--theme-content-font-family)',
        sizes: {
            h1: {
                fontSize: rem('36px'),
                fontWeight: '600',
                lineHeight: rem('44px'),
            },
            h2: {
                fontSize: rem('30px'),
                fontWeight: '600',
                lineHeight: rem('38px'),
            },
            h3: {
                fontSize: rem('24px'),
                fontWeight: '600',
                lineHeight: rem('32px'),
            },
            h4: {
                fontSize: rem('20px'),
                fontWeight: '600',
                lineHeight: rem('30px'),
            },
        },
    },
    lineHeights: {
        lg: rem('20px'),
        md: rem('18px'),
        sm: rem('16px'),
        xl: rem('24px'),
        xs: rem('14px'),
    },
    luminanceThreshold: 0.3,
    primaryColor: 'primary',
    primaryShade: { dark: 5, light: 9 },
    radius: {
        lg: rem('12px'),
        md: rem('5px'),
        sm: rem('3px'),
        xl: rem('16px'),
        xs: rem('3px'),
    },
    scale: 1,
    shadows: {
        lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
        xxl: '0 25px 50px rgba(0, 0, 0, 0.25)',
    },
    spacing: {
        '0': rem('0px'),
        '2xl': rem('32px'),
        '3xl': rem('36px'),
        '4xl': rem('40px'),
        lg: rem('16px'),
        md: rem('12px'),
        sm: rem('8px'),
        xl: rem('24px'),
        xs: rem('4px'),
    },
});

export function createMantineTheme(theme: AppThemeConfiguration): MantineThemeOverride {
    const primaryColor = theme.colors?.primary ?? '#000';

    const mergedTheme: MantineThemeOverride = merge(
        {},
        {
            ...mantineTheme,
            black: theme.colors?.black,
            colors: {
                dark: darkColors,
                primary: generateColors(primaryColor),
            },
            white: theme.colors?.white,
        },
        theme.mantineOverride,
    );
    return createTheme(mergedTheme);
}
