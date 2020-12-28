/* istanbul ignore file */
const hookEntityDefinitions = {
  allRequests: `Every request object collected from all routes during bootstrap. It is important to note that 'allRequests' will be different at the 'request' hook during a build because the requests are split between different processes during build time using the allRequests object.`,
  hookInterface:
    'The hook interface is what defines the "contract" for each hook. It includes what properties the hook has access to and which of those properties can be mutated.',
  errors: 'An array of errors collected during the build process.',
  helpers:
    'An object of helpers loaded from `./src/helpers/index.js` in addition to the Elder.js provided helper functions.',
  data: 'An object that is passed to Svelte templates as the "data" prop.',
  settings: 'An object representing the elder.config.js and other details about the build.',
  routes: 'An object that represents all of the routes registered with Elder.js.',
  hooks: 'An array of all of the hooks that have been validated by Elder.js.',
  query: 'An object that is initially empty but is reserved for plugins and sites to add database or api access to.',
  route: 'An object representing the specific route (similar to a route.js file) for a specific request.',
  htmlAttributesStack:
    'A "stack" of attributes to be merged together that are written to the <html> tag.By default, it containt "{lang: "en"}" or an other lang set in your elder.config.js',
  bodyAttributesStack: 'A "stack" of attributes to be merged together that are written to the <body> tag.',
  headStack:
    'A "stack" of strings to be merged together (along with cssStack) that are written to the <head> tag. If you are looking to customize the head you\'re probably better looking at the "headString."',
  cssStack:
    'A "stack" of strings to be merged together to create the the cssString prop. This is mainly uses to collect the css strings emitted by SSR\'d Svelte files.',
  styleTag: 'The full <style></style> tag that is going to be written to the head of the page.',
  cssString:
    'The the css string that is wrapped in the styleTag. Added purely for convenience in case users wanted to minify the css.',
  htmlAttributesString: 'The complete html attributes as a string just before it is written.',
  bodyAttributesString: 'Body attributes as a string just before it is written.',
  headString: 'The complete <head></head> string just before it is written to the head.',
  request:
    'An object that represents the parameters required to generate a specific page on a specific route. This object originating from the all() query of a route.js file.',
  beforeHydrateStack:
    'A "stack" of generally JS script tags that are required to be loaded before a Svelte component is hydrated. This is only written to the page when a Svelte component needs to be hydrated.',
  hydrateStack: 'A "stack" Svelte components that will be hydrated.',
  customJsStack:
    'A "stack" of user specific customJs strings that will to be merged together. This is written after the Svelte components.',
  footerStack: 'A "stack" of strings to be merged together that will be added to the footer tag.',
  htmlString: 'The fully generated html for the page.',
  timings: 'An array of collected timings of the system. These are collected using the performance observer.',
  req: "The 'req' object from Express or Polka when Elder.js is being used as a server.",
  next: "The 'next' object from Express or Polka when Elder.js is being used as a server.",
  res: "The 'res' object from Express or Polka when Elder.js is being used as a server.",
  templateHtml: "The HTML string returned by the SSR'd Svelte template for the request's route.",
  shortcodes: "An array of shortcode definitions that are processed on the 'shortcodes' hook.",
  footerString: 'A HTML string that Elder.js will write to the footer.',
  layoutHtml:
    "The compiled HTML response for a route containing all of the HTML from the Route's layout and template. ",
  serverLookupObject: `A key value object where the key is the relative permalink and the object is the 'request' object used by the Elder.js server.`,
  runHook: `The function that powers hooks. 'await runhook('hookName', objectContainingProps)`,
};

// eslint-disable-next-line import/prefer-default-export
export { hookEntityDefinitions };
