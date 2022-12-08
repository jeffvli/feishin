export const randomString = (length?: number) => {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let string = '';
  for (let i = 0; i < (length || 12); i += 1) {
    const randomPoz = Math.floor(Math.random() * charSet.length);
    string += charSet.substring(randomPoz, randomPoz + 1);
  }
  return string;
};
