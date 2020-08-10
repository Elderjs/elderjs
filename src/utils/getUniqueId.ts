import generate from 'nanoid/non-secure/generate';

// generate a 10 digit unique ID
const getUniqueId = () => {
  return generate('bcdfgjklmnpqrstvwxyzVCDFGJKLMNQRSTVWXYZ', 10);
};

export default getUniqueId;
