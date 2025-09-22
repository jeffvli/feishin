module.exports = {
    plugins: {
        'postcss-preset-mantine': {},
        'postcss-simple-vars': {
            variables: {
                'breakpoint-xs': '36em',
                'breakpoint-sm': '48em',
                'breakpoint-md': '62em',
                'breakpoint-lg': '75em',
                'breakpoint-xl': '88em',
                'breakpoint-2xl': '120em',
                'breakpoint-3xl': '160em',
            },
        },
    },
};
