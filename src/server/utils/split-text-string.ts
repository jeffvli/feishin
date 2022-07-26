export const splitTextString = (string: string, delimiter = ',') => {
  return string.split(delimiter).map((s: string) => {
    return String(s);
  });
};
