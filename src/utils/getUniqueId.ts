import hexoid from 'hexoid';
const id = hexoid(10);
const getUniqueId = (): string => {
  return id();
};

export default getUniqueId;
