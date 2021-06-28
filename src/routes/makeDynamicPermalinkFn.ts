import regexparam from 'regexparam';

export default function makeDynamicPermalinkFn(routeString) {
  return function permalink({ request }) {
    return regexparam.inject(routeString, request);
  };
}
