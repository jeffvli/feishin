export const getHeaderColor = (rgbColor: string, opacity?: number) => {
    return rgbColor.replace('rgb', 'rgba').replace(')', `, ${opacity || 0.8})`);
};
