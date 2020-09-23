const wrapPermalinkFn = (permalinkFn, routeName) => (payload) => {
  let permalink = permalinkFn(payload);
  if (typeof permalink !== 'string') {
    throw new Error(
      `The permalink function for route: "${routeName}" returned ${JSON.stringify(
        permalink,
        null,
        2,
      )} for request object ${JSON.stringify(payload, null, 2)}. This is not a string which is required.`,
    );
  }
  if (permalink[0] !== '/') {
    console.warn(
      `The permalink function for route "${routeName}" does not return a string with a beginning slash. One has been added. To disable this warning, fix the function's return value to include a beginning slash.`,
    );
    permalink = `/${permalink}`;
  }
  if (permalink.slice(-1) !== '/') {
    console.warn(
      `The permalink function for route "${routeName}" does not return a string with a ending slash. One has been added. To disable this warning, fix the function's return value to include a ending slash.`,
    );
    permalink = `${permalink}/`;
  }
  return permalink;
};

export default wrapPermalinkFn;
