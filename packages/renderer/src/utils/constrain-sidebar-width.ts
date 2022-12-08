export const constrainSidebarWidth = (num: number) => {
  if (num < 200) {
    return 200;
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
