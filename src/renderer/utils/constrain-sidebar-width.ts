export const constrainSidebarWidth = (num: number) => {
    if (num < 260) {
        return 260;
    }

    if (num > 400) {
        return 400;
    }

    return num;
};

export const constrainRightSidebarWidth = (num: number) => {
    if (num < 250) {
        return 250;
    }

    if (num > 960) {
        return 960;
    }

    return num;
};
