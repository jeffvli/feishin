export const constrainSidebarWidth = (num: number) => {
  if (num < 165) {
    return 165;
  }

  if (num > 400) {
    return 400;
  }

  return num;
};
