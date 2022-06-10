import { inject } from 'regexparam';

export default function makeDynamicPermalinkFn(routeString) {
  return function permalink({ request }) {
    return inject(routeString, request);
  };
}
