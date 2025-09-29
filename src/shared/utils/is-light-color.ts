import { isLightColor as isLightColorMantine } from '@mantine/core';

export const isLightColor = (color: string) => {
    return isLightColorMantine(color);
};
