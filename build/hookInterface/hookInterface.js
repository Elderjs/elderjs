"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookInterface = void 0;
// Notes:
// plugins automatically have the object returned from their init() function added to the props/mutable arrays of each hook.
exports.hookInterface = [
    {
        hook: 'customizeHooks',
        props: ['hookInterface', 'customProps', 'errors'],
        mutable: ['hookInterface', 'customProps', 'errors'],
        context: 'Run before collecting all hooks.',
        use: `<p>This hook receives the hookInterface.ts file which defines all hook interactions. You can customize all 'props' and 'mutable' of
      all hooks by using this hook. This is a power user hook and would often be used in conjunction with customProps.</p>`,
        location: 'Elder.ts',
        experimental: true,
        advanced: true,
    },
    {
        hook: 'bootstrap',
        props: ['helpers', 'data', 'settings', 'routes', 'hooks', 'query', 'errors'],
        mutable: ['errors', 'helpers', 'data', 'settings', 'query'],
        context: 'Routes, plugins, and hooks have been collected and validated.',
        use: `<ul>
    <li>Often used to populate the empty query object with a database or API connection as query is passed to the all() function which is used to generate request objects.</li>
    <li>Internally used to automatically populate the helpers object with the helpers found in './src/helpers/index.js'.</li>
    <li>Can be used to set information on the data object that is needed throughout the entire lifecycle. (sitewide settings)</li>
    </ul>`,
        location: 'Elder.ts',
        experimental: false,
        advanced: false,
    },
    {
        hook: 'allRequests',
        props: ['helpers', 'data', 'settings', 'allRequests', 'routes', 'query', 'errors'],
        mutable: ['errors', 'allRequests'],
        context: `allRequests which represents all of the request objects have been collected from route and plugins. This makes the 'allRequests' array mutable.`,
        use: `<p>The main use here is to allow users to adjust the requests that Elder.js is aware of.</p>
    <ul>
    <li>This could be used for incremental builds. By filtering and overwriting the allRequests array building just a single route or even a single request is doable.</li>
    <li>This hook is used by elderjs-plugin-random to register temporary requests that it later intercepts to redirect to a random page of a route.</li>
    <li>This hook is used by elderjs-plugin-markdown to register processed markdown files and their slugs Elder.js</li>
    </ul>`,
        location: 'Elder.ts',
        experimental: false,
        advanced: true,
    },
    // above this is Elder.js
    {
        hook: 'middleware',
        props: [
            'errors',
            'request',
            'query',
            'helpers',
            'data',
            'route',
            'settings',
            'allRequests',
            'routes',
            'customProps',
            'req',
            'next',
            'res',
        ],
        mutable: [
            'errors',
            'request',
            'query',
            'helpers',
            'data',
            'route',
            'settings',
            'allRequests',
            'routes',
            'customProps',
            'req',
            'next',
            'res',
        ],
        context: 'Fired upon a request that originates from the express/polka middleware version of Elder.js. The hook has access to "req" and "next" common in express like middleware.',
        use: `<p>If you're looking to use Elder.js with express/polka to build a server rendered website, then you'll be interested in this hook as it includes the familiar 'req' and 'next' objects as often used in Express middleware.</p>
    <ul>
    <li>This hook could be used to set user or session information stored on the 'req' prop anywhere it is needed such as on the Elder.js 'request' object or 'data' object.</li>
    <li>If you're looking to pass in details about the query string deeper into your application, you could use this hook to do so.</li>
    <li>Anything you'd use an Express 'req' or 'next' for you can do and customize other parts of the Elder.js on this hook.</li>
    </ul>`,
        location: 'prepareServer.ts',
        experimental: true,
        advanced: true,
    },
    {
        hook: 'modifyCustomProps',
        props: ['customProps', 'request', 'errors', 'helpers', 'query', 'settings'],
        mutable: ['customProps', 'request', 'errors', 'helpers', 'query'],
        context: 'This hook is run just after a Page.ts object is created for a request. Page.ts objects are the main object used during page generation.',
        use: `<p>This hook is often used in conjunction with the 'customizeHooks' hook to modify 'customProps' based on the request. This is very much a power user hook.</p>`,
        location: 'Page.ts',
        experimental: true,
        advanced: true,
    },
    {
        hook: 'request',
        props: ['helpers', 'data', 'settings', 'request', 'allRequests', 'query', 'errors', 'routes', 'route'],
        mutable: ['errors', 'helpers', 'data', 'settings', 'request', 'route'],
        context: `This is executed at the beginning the request object being processed.`,
        use: `<p>This hook gives access to the entire state of a request lifecycle before it starts.</p>
    <ul>
      <li>Primarily used to set 'request' specific data that is required by all routes so doesn't make sense to store across multiple 'data.js' files.</li>
      <li>If you have helper functions that need a closure isolated to a specific page generation lifecycle here is where you should attach them.</li>
      <li>If you need to programmatically change the route, you can do so here. This is how the elderjs-plugin-random works.</li>
      <li>This hook is commonly uses by plugins that need to add route level data that is dependent on the request to populate.</li>
    </ul>
    `,
        location: 'Page.ts',
        experimental: false,
        advanced: false,
    },
    {
        hook: 'data',
        props: [
            'data',
            'request',
            'errors',
            'helpers',
            'query',
            'routes',
            'cssStack',
            'headStack',
            'beforeHydrateStack',
            'hydrateStack',
            'customJsStack',
            'footerStack',
            'settings',
        ],
        mutable: [
            'errors',
            'data',
            'cssStack',
            'headStack',
            'beforeHydrateStack',
            'hydrateStack',
            'customJsStack',
            'footerStack',
        ],
        context: `This hook is run after the route's data.js file has executed.`,
        use: `<p>This hook is mainly used by plugins/hooks to offer functionality at the route level that is dependent on the data.js returning but isn't suitable to live in data.js on many routes due to code duplication.</p>
    <p>Examples of things we (ElderGuide.com) have done or have seen users do:</p>
    <ul>
      <li><strong>LD+JSON</strong>: Plugins/hooks that add LD+JSON may need the data.js file to be executed before they have the data needed to run.</li>
      <li><strong>Breadcrumbs</strong>: Plugins/hooks that add breadcrumbs may be dependent on data.js.</li>
      <li><strong>Table Of Contents</strong>: Plugins/hooks that automatically generate a table of contents will be dependent on data from data.js has run.</li>
      <li><strong>Reference Plugins</strong>: Plugins/hooks that collect references from content and add them to the footer of the page content.</li>
      <li><strong>Last Updated Data</strong>: Determining the last updated date for a page is often better to do in a central place instead of in many data.js file and is dependent on data from data.js.</li>
    </ul>
    <p>Stacks are made available here so that strings can be added to the head or footer of the page easily.</p>
    `,
        location: 'Page.ts',
        experimental: false,
        advanced: true,
    },
    {
        hook: 'stacks',
        props: [
            'helpers',
            'data',
            'settings',
            'request',
            'query',
            'errors',
            'cssStack',
            'headStack',
            'beforeHydrateStack',
            'hydrateStack',
            'customJsStack',
            'footerStack',
        ],
        mutable: ['errors', 'cssStack', 'headStack', 'beforeHydrateStack', 'hydrateStack', 'customJsStack', 'footerStack'],
        context: 'Executed just before processing all of the stacks into strings.',
        use: `<p>Elder.js uses 'stacks' to manage it's string concatenation. If you are unfamiliar, stacks are basically an array of strings, with a priority, and some meta data. This hook let's you manipulate or view the stacks before they are written to the page and is designed for use by plugins.</p>
          <p>This hook will mainly be used when you need to add arbitrary strings to the footer. In most cases, users should be using &lt;svelte:head&gt;&lt;/svelte:head&gt; to add content to the head.</p> 
          <ul>
            <li><strong>headStack:</strong> Internally all content used in <svelte:head></svelte:head> are added to the head stack. If you were looking to add ld+json to the page, you could do it here. If you're looking to write &lt;title&gt; tags, we recommend doing it within Svelte templates unless you are writing a plugin in which case you may want to also look at the 'head' hook.</li>
            <li><strong>cssStack:</strong> The 'cssStack' represents all of the css strings emitted by the SSR Svelte components. Plugins can add css here (such as critical path CSS), but we recommend users add them directly in Svelte files. Note: Do not wrap strings added to the stack in &lt;style&gt;</style>.</li>
            <li><strong>beforeHydrateStack:</strong> default this stack includes a polyfill for intersection observer and systemjs for loading svelte. This stack is not run unless there are Svelte components to be hydrated. </li>
            <li><strong>hydrateStack:</strong> the hydrateStack contains strings which represent all of the root svelte components which will be hydrated.</li>
            <li><strong>customJsStack:</strong> Used to add custom JS to the site. This is done after the Svelte components are written to the page. </li>
            <li><strong>footerStack:</strong> the footerStack which is an array of html or html friendly strings that will be written to the footer. This is generally the ideal place for plugins to add Analytics scripts as it fires after all other JS.</li>
          </ul>
      `,
        location: 'Page.ts',
        experimental: false,
        advanced: true,
    },
    {
        hook: 'head',
        props: ['helpers', 'data', 'settings', 'request', 'headString', 'query', 'errors'],
        mutable: ['errors', 'headString'],
        context: 'Executed just before writing the <head> tag to the page.',
        use: `<p>This hook's headSting represents everything that will be written to &lt;head&gt; tag excluding CSS (those are managed on the style hook).</p>
       <p>There are many possible SEO uses to this hook, especially for plugins. That said, we recommend users who want to set common SEO elements such as tags &lt;title&gt; and meta descriptions programatically to do it from within Svelte templates using the &lt;svelte:head&gt;&lt;/svelte:head&gt; tag. Chances are you won't need this field unless you're a power user and need access to the raw head.</p>`,
        location: 'Page.ts',
        experimental: false,
        advanced: true,
    },
    {
        hook: 'html',
        props: ['helpers', 'data', 'settings', 'request', 'htmlString', 'query', 'errors'],
        mutable: ['errors', 'htmlString'],
        context: 'Executed when all of the html has been compiled.',
        use: `<p>This hook receives the full html of the document. With great power comes great responsibility.</p>
    <ul>
    <li>Can be used to compress the html/css/js.</li>
    <li>Could be used to programmatically extract h2/h3 tags and build/inject a table of contents with something like Cheeriojs.</li>
    <li>If you need to modify the final html output, here is where you can do it.</li>
    </ul>`,
        location: 'Page.ts',
        experimental: false,
        advanced: false,
    },
    {
        hook: 'requestComplete',
        props: ['request', 'htmlString', 'query', 'settings', 'errors', 'timings', 'data'],
        mutable: ['errors'],
        context: 'This hook marks the end of the request lifecycle.',
        use: `<p>This hook is triggered on an individual 'request object' completing whether Elder.js is being used in the "build" or a "server" mode.</p>
    <ul>
    <li> Internally, Elder.js uses this hook to write html to the "public folder".</li>
    <li> Useful for uploading static html to s3 or another source.</li>
    <li> Could also be used to write the output of the data.js file to help with client site routing if you were so inclined.</li>
    <li> This hook may also be used by plugins to clean up any request specific 'state' they have stored.</li>
    <li> By default Elder.js adds a hook here to all server requests that outputs how long the request took to generate. If you want to see detailed output from this hook set debug.speed = true in your config file.</li>
    </ul>`,
        location: 'Page.ts',
        experimental: false,
        advanced: false,
    },
    {
        hook: 'error',
        props: ['helpers', 'data', 'settings', 'request', 'query', 'errors'],
        mutable: [],
        context: 'Executed only if the script has encountered errors and they are pushed to the errors array.',
        use: `<p>As the script encounters errors, they are collected and presented on this hook at the end of a request and the end of an entire build.</p>`,
        location: 'Page.ts, build.ts',
        experimental: false,
        advanced: false,
    },
    {
        hook: 'buildComplete',
        props: ['helpers', 'data', 'settings', 'timings', 'query', 'errors', 'routes'],
        mutable: [],
        context: 'Executed after a build is complete',
        use: `<p>Contains whether the build was successful. If not it contains errors for the entire build. Also includes
      average performance details, and a granular performance object. Could be used to fire off additional scripts such as generating a sitemap or copying asset files to the public folder.</p>
      <p><strong>Plugins: </strong> Because builds are split across processes, a plugin doesn't not have a shared memory space across all processes.</p>`,
        location: 'build.ts',
        experimental: false,
        advanced: false,
    },
];
exports.default = exports.hookInterface;
// {
//   hook: 'dataStart',
//   props: ['helpers', 'data', 'settings', 'request', 'query', 'errors'],
//   mutable: ['errors', 'data'],
//   context: "This is executed just be for a route's data file",
//   use:
//     '<p>This hook is commonly uses by plugins that need to add route level data that is dependent on the request to populate.</p>',
//   location: 'Page.ts',
// },
// todo: rename to "requestStart" to"request"
// todo: update the example in the template that uses the footerStack
// move timings to request complete and buildComplete
// todo: move EG critical path css to stacks
// {
//   hook: 'style',
//   props: ['helpers', 'data', 'settings', 'request', 'styleTag', 'cssString', 'query', 'errors'],
//   mutable: ['errors', 'styleTag'],
//   context: 'Executed after the cssStack has been compiled and before the styleTag is added to the head. ',
//   use: `<p>This hook receives the &lt;style&gt; tag and the cssString from the cssStack for modification before it is written to the head.</p>
//   <ul>
//   <li>The main use is to programatically write critical path CSS styles. </li>
//   </ul>`,
//   location: 'Page.ts',
//   experimental: false,
//   advanced: false,
// },
// {
//   hook: 'footerStack',
//   props: ['helpers', 'data', 'settings', 'request', 'footerStack', 'query', 'errors'],
//   mutable: ['errors', 'footerStack'],
//   context: 'Executed just before the "footerStack" is reduced to a string.',
//   use: `<p>This hook gives access to the footerStack which is an array of html or html friendly strings that will be written to the footer.Ideal place for plugins to add Analytics scripts as it fires after all other JS.</p>`,
//   location: 'Page.ts',
// },
// {
//   hook: 'beforeHydrateStack',
//   props: ['helpers', 'data', 'settings', 'request', 'beforeHydrateStack', 'query', 'errors'],
//   mutable: ['errors', 'beforeHydrateStack'],
//   context: 'Executed just before the "beforeHydrateStack" is reduced to a string.',
//   use: `<p>This hook gives access to the beforeHydrateStack array which by default includes a polyfill for intersection observer and systemjs for loading svelte. This stack is not run unless there are svelte components to be hydrated. This hook was designed to give users the option to
//   change away from systemjs or add their own intersectionObserver.</p>`,
//   location: 'Page.ts',
// },
// {
//   hook: 'headStack',
//   props: ['helpers', 'data', 'settings', 'request', 'headStack', 'query', 'errors'],
//   mutable: ['errors', 'headStack'],
//   context: `Fired just before the headStack is reduced to a string.`,
//   use: `<p>Used to edit the 'headStack' before it is sorted and compiled into a string.</p>
//   <ul>
//   <li>Internally all content used in <svelte:head></svelte:head> is added here.</li>
//   <li>If you have ld+json that you want added to a page, you could do it here.</li>
//   <li><strong>NOTE:</strong> This hook is used to set a <title></title> tag it could be changed later. The recommended place to add your title tag is on the 'head' hook.</li>
//   </ul>`,
//   location: 'Page.ts',
// },
// {
//   hook: 'cssStack',
//   props: ['helpers', 'data', 'settings', 'request', 'cssStack', 'query', 'errors'],
//   mutable: ['errors', 'cssStack'],
//   context: 'Executed just before the cssStack is compiled.',
//   use: `<p>The 'cssStack' represents all of the css strings emitted by the SSR Svelte components. Plugins can add css here, but we recommend users add them directly in Svelte files. Note: Do not wrap strings added to the stack in &lt;style&gt;</style>.</p>`,
//   location: 'Page.ts',
// },
// {
//   hook: 'initStacks',
//   props: [
//     'cssStack',
//     'headStack',
//     'beforeHydrateStack',
//     'hydrateStack',
//     'customJsStack',
//     'footerStack',
//     'query',
//     'errors',
//     'settings',
//     'data',
//     'request',
//   ],
//   mutable: [
//     'errors',
//     'cssStack',
//     'headStack',
//     'beforeHydrateStack',
//     'hydrateStack',
//     'customJsStack',
//     'footerStack',
//     'query',
//   ],
//   context:
//     'This hook is run after stacks are initialized in Page.ts and Elder.js has added the standard attributes to these stacks.',
//   use: `<p>This hook offers access to adding or modifying various stacks. If you need to seed multiple stacks with data based on the request you can access them here. This hook is mainly designed for plugins to not have to write to multiple hooks to manage stacks.</p>`,
//   location: 'Page.ts',
// },
// {
//   hook: 'timings',
//   props: ['helpers', 'data', 'settings', 'request', 'query', 'errors', 'timings'],
//   mutable: ['errors'],
//   context: 'Fired at the end of an individual request or the end of an entire build.',
//   use: `<p>Performance array of how long each step of the request took. By default Elder.js adds a hook here to all server requests that outputs how long the request took to generate.</p>
//         <p>If you want to see detailed output from this hook set debug.speed = true in your config file.</p>`,
//   location: 'Page.ts, build.ts',
// },
// {
//   hook: 'writeFile',
//   props: ['helpers', 'data', 'settings', 'request', 'htmlString', 'query', 'errors'],
//   mutable: ['errors'],
//   context: 'Executed when Elder.js is going to write the file.',
//   use: `<p>HTML files are written to the ./public/ folder here by an Elder.js hook.</p>`,
//   location: 'Page.ts',
// },
// to "data"
// {
//   hook: 'dataComplete',
//   props: [
//     'helpers',
//     'data',
//     'settings',
//     'request',
//     'query',
//     'headStack',
//     'footerStack',
//     'cssStack',
//     'customJsStack',
//     'route',
//     'errors',
//     'routes',
//   ],
//   mutable: ['errors', 'data', 'headStack', 'footerStack', 'cssStack', 'customJsStack', 'query'],
//   context:
//     "Executed just before data and other properties are passed to the route's Svelte template and Svelte layout.",
//   use:
//     '<p>Useful for adjusting the data object, adding properties to stacks. Could also be used to write the output of the data.js file to help with client site routing if you were so inclined. This plugin is mainly here for plugins.</p>',
//   location: 'Page.ts',
// },
