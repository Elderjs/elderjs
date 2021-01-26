import get from 'lodash.get';

const wrapPermalinkFn = ({ permalinkFn, routeName, settings }) => (payload) => {
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

  if (permalink !== '/') {
    if (permalink[0] !== '/') {
      if (settings.debug.automagic) {
        console.warn(
          `The permalink function for route "${routeName}" does not return a string with a beginning slash. One has been added. To disable this warning, fix the function's return value to include a beginning slash.`,
        );
      }
      permalink = `/${permalink}`;
    }
    if (permalink.slice(-1) !== '/') {
      if (settings.debug.automagic) {
        console.warn(
          `The permalink function for route "${routeName}" does not return a string with a ending slash. One has been added. To disable this warning, fix the function's return value to include a ending slash.`,
        );
      }
      permalink = `${permalink}/`;
    }
  }

  if (permalink.indexOf('//') !== -1) {
    throw new Error(
      `Permalink issue. ${permalink} has two slashes. You should adjust the route's permalink function. This usually happens when one of the variables needed by the permalink function is undefined. request: ${JSON.stringify(
        payload.request,
      )}`,
    );
  }

  if (permalink.indexOf('undefined') !== -1) {
    console.warn(
      `Potential permalink issue. ${permalink} has 'undefined' in it. Valid URLs can sometimes have the word undefined, but this usually happens when one of the variables needed by the permalink function is undefined. request: ${JSON.stringify(
        payload.request,
      )}`,
    );
  }

  if (permalink.indexOf('null') !== -1) {
    console.warn(
      `Potential permalink issue. ${permalink} has 'null' in it. Valid URLs can sometimes have the word null, but this usually happens when one of the variables needed by the permalink function is undefined. request: ${JSON.stringify(
        payload.request,
      )}`,
    );
  }

  const prefix = get(settings, '$$internal.serverPrefix', '');

  return prefix ? prefix + permalink : permalink;
};

export default wrapPermalinkFn;
