export const uniqueArray = (value: any, index: any, self: any) => {
  return self.indexOf(value) === index && value !== undefined;
};
