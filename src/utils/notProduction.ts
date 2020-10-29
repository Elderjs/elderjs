const notProduction = () => String(process.env.NODE_ENV).toLowerCase() !== 'production';
export default notProduction;
