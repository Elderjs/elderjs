import generate from 'nanoid/non-secure/generate';

/**
 * Used to generate a 10 digit unique ID
 *
 * @returns {String}
 */
const getUniqueId = () => {
  return generate('bcdfgjklmnpqrstvwxyzVCDFGJKLMNQRSTVWXYZ', 10);
};

export default getUniqueId;
