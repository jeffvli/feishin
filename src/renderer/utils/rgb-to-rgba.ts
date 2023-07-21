export const rgbToRgba = (rgb: string | undefined, alpha: number) => {
    if (!rgb) {
        return undefined;
    }

    return rgb.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
};
