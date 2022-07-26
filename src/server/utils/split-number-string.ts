export const splitNumberString = (string?: string, delimiter = ',') => {
  if (!string) {
    return undefined;
  }

  return string.split(delimiter).map((s: string) => {
    return Number(s);
  });
};
