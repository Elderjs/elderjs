import { customAlphabet } from 'nanoid/non-secure';

const nanoid = customAlphabet('bcdfgjklmnpqrstvwxyzVCDFGJKLMNQRSTVWXYZ', 10);

// generate a 10 digit unique ID
const getUniqueId = (): string => {
  return nanoid();
};

export default getUniqueId;
