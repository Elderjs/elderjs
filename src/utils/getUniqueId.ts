import { customAlphabet } from 'nanoid/non-secure';

const nanoid = customAlphabet('bcdfgjklmnpqrstvwxyzVCDFGJKLMNQRSTVWXYZ', 10);

// generate a 10 digit unique ID
const getUniqueId = (): string => {
  return nanoid();
};

export default getUniqueId;

export function prepareGetUniqueId() {
  let i = 0;
  return () => {
    const result = i.toString(36);
    i += 1;
    return result;
  };
}
