<div align="center">
  <img src="https://github.com/elderjs/elderjs/raw/master/elderjs.png" alt="Elder.js" width="300" />
</div>

<h1 align="center">Elder.js: an SEO first Svelte Framework & Static Site Generator</h1>

<div align="center">
  <a href="https://npmjs.org/package/@elderjs/elderjs">
    <img src="https://badgen.net/npm/v/@elderjs/elderjs" alt="version" />
  </a>
  <a href="https://codecov.io/gh/elderjs/elderjs">
    <img src="https://badgen.net/codecov/c/github/elderjs/elderjs" alt="codecov" />
  </a> 
  <a href="https://github.com/elderjs/elderjs/actions?query=workflow%3A%22Elder.js+CI%22">
    <img src="https://github.com/Elderjs/elderjs/workflows/Elder.js%20CI/badge.svg" alt="elder.js ci" />
  </a>
  <a href="https://github.com/Elderjs/elderjs">
    <img src="https://img.shields.io/badge/dynamic/json?color=brightgreen&label=Node&query=engines.node&url=https%3A%2F%2Fraw.githubusercontent.com%2Felderjs%2Felderjs%2Fmaster%2Fpackage.json" alt="node version" />
  </a>
</div>

<br />

[Elder.js](https://elderguide.com/tech/elderjs/) is an opinionated static site generator and web framework built with SEO in mind. (Supports SSR and Static Site Generation.)

- [Full Docs](https://elderguide.com/tech/elderjs/)
- [Template](https://github.com/Elderjs/template)
- [Plugins](https://github.com/Elderjs/plugins)

**Features:**

- [**Build hooks**](https://elderguide.com/tech/elderjs/#hooks-how-to-customize-elderjs) allow you to plug into any part of entire page generation process and customize as needed.
- **A Highly Optimized Build Process:** that will span as many CPU cores as you can throw at it to make building your site as fast as possible. For reference Elder.js easily generates a data intensive 18,000 page site in 8 minutes using a budget 4 core VM.
- **Svelte Everywhere:** Use Svelte for your SSR templates and with partial hydration on the client for tiny html/bundle sizes.
- **Straightforward Data Flow:** By simply associating a `data` function in your `route.js`, you have complete control over how you fetch, prepare, and manipulate data before sending it to your Svelte template. Anything you can do in Node.js, you can do to fetch your data. Multiple data sources, no problem.
- **Community Plugins:** Easily extend what your Elder.js site can do by adding [prebuilt plugins](https://github.com/Elderjs/plugins) to your site.
- **Shortcodes:** Future proof your content, whether it lives in a CMS or in static files using smart placeholders. These shortcodes can be async!
- **0KB JS**: Defaults to 0KB of JS if your page doesn't need JS.
- **Partial Hydration**: Unlike most frameworks, Elder.js lets you hydrate just the parts of the client that need to be interactive allowing you to dramatically reduce your payloads while still having full control over component lazy-loading, preloading, and eager-loading.

**Context**

Elder.js is the result of our team's work to build this site ([ElderGuide.com](https://elderguide.com)) and was purpose built to solve the unique challenges of building flagship SEO sites with 10-100k+ pages.

Elder Guide Co-Founder [Nick Reese](https://nicholasreese.com) has built or managed 5 major SEO properties over the past 14 years. After leading the transition of several complex sites to static site generators he loved the benefits of the JAM stack, but wished there was a better solution for complex, data intensive, projects. Elder.js is his vision for how static site generators can become viable for sites of all sizes regardless of the number of pages or how complex the data being presented is.

We hope you find this project useful whether you're building a small personal blog or a flagship SEO site that impacts millions of users.

## Project Status: Stable

Elder.js is stable and production ready.

It is being used on ElderGuide.com and 2 other flagship SEO properties that are managed by the maintainers of this project.

We believe Elder.js has reached a level of maturity where we have achieved the majority of the vision we had for the project when we set out to build a static site generator.

Our goal is to keep the hookInterface, plugin interface, and general structure of the project as static as possible.

This is a lot of words to say we’re not looking to ship a bunch of breaking changes any time soon, but will be shipping bug fixes and incremental changes that are mostly “under the hood.”

The ElderGuide.com team expects to maintain this project until 2023-2024. For a clearer vision of what we mean by this and what to expect from the Elder.js team as far as what is considered "in scope" and what isn't, [please see this comment](https://github.com/Elderjs/elderjs/issues/31#issuecomment-690694857).

## Getting Started:

The quickest way to get started is to get started with the [Elder.js template](https://github.com/Elderjs/template) using [degit](https://github.com/Rich-Harris/degit):

```sh
npx degit Elderjs/template elderjs-app

cd

npm install # or "yarn"

npm start

open http://localhost:3000
```

This spawns a development server, so simply edit a file in `src`, save it, and reload the page to see your changes.

Here is a demo of the template: [https://elderjs.pages.dev/](https://elderjs.pages.dev/)

### To Build/Serve HTML Locally:

```bash
npm run build
```

Let the build finish.

```bash
npx sirv-cli public
```

## Full documentation here: https://elderguide.com/tech/elderjs/
