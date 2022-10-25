// export const encryptString = (str: string) => {
//   return cryptr;

//   // const iv = crypto.randomBytes(16);
//   // const key = crypto.randomBytes(32);
//   // const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

//   // let data = cipher.update(str, 'utf-8', 'hex');
//   // data += cipher.final('hex');

//   // return { data, iv, key };
// };

// export const decryptString = ({
//   data,
//   key,
//   iv,
// }: {
//   data: string;
//   iv: string;
//   key: string;
// }) => {
//   const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
//   let decryptedData = decipher.update(data, 'hex', 'utf-8');
//   decryptedData += decipher.final('utf8');

//   return decryptedData;
// };
