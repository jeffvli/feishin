export const constrainSidebarWidth = (num: number) => {
  if (num < 200) {
    return 200;
  }

  if (num > 400) {
    return 400;
  }

  return num;
};
