<div align="center">
  <img src="https://github.com/elderjs/elderjs/raw/master/elderjs.png" alt="Elder.js" width="300" />
</div>

<h1 align="center">Elder.js: SEO focused, Svelte Framework & Static Site Generator</h1>

<div align="center">
  <a href="https://npmjs.org/package/polka">
    <img src="https://badgen.now.sh/npm/v/polka" alt="version" />
  </a>
  <a href="https://codecov.io/gh/elderjs/elderjs">
    <img src="https://badgen.now.sh/codecov/c/github/elderjs/elderjs" alt="codecov" />
  </a> 
  <a href="https://github.com/elderjs/elderjs/actions?query=workflow%3A%22Elder.js+CI%22">
    <img src="https://github.com/Elderjs/elderjs/workflows/Elder.js%20CI/badge.svg" "elder.js ci" />
  </a>
  <a href="https://github.com/Elderjs/elderjs">
    <img src="https://img.shields.io/badge/dynamic/json?color=brightgreen&label=Node&query=engines.node&url=https%3A%2F%2Fraw.githubusercontent.com%2Felderjs%2Felderjs%2Fmaster%2Fpackage.json" alt="node version" />
  </a>
</div>

<br />


Elder.js is an opinionated static site generator and web framework built with SEO in mind.  :rocket:

**We consider Elder.js to be in 'beta' and are using it in production https://elderguide.com.**

If you find bugs please open an issue.

## Features:

* [**Build hooks**](https://elderguide.com/tech/elderjs/#hooks-how-to-customize-elderjs) allow you to plug into any part of entire page generation process and build process and customize as needed.
* **A Highly Optimized Build Process:** that will span as many CPU cores as you can throw at it to make building your site as fast as possible. For reference Elder.js easily generates a data intensive 18,000 page site in 8 minutes using a budget 4 core VM.
* **Svelte Everywhere:** Use Svelte for your SSR templates and with partial hydration on the client for tiny html/bundle sizes.
* **Straightforward Data Flow:** By simply associating a `data.js` file with your route, you have complete control over how you fetch, prepare, and manipulate data before sending it to your Svelte template.  Anything you can do in Node.js, you can do to fetch your data. Multiple data sources, no problem.
* **Community Plugins:** Easily extend what your Elder.js site can do by adding [prebuilt plugins](https://github.com/Elderjs/plugins) to your site.


## Context

Elder.js is the result of our team's work to build ([ElderGuide.com](https://elderguide.com)) and was purpose built to solve the unique challenges of building flagship SEO sites with 10-100k+ pages. 

Elder Guide co-Founder [Nick Reese](https://nicholasreese.com) has built or managed 5 major SEO properties over the past 14 years. After leading the transition of several complex sites to static site generators he loved the benefits of the JAM stack, but wished there was a better solution for complex, data intensive, projects. Elder.js is his vision for how static site generators can become viable for sites of all sizes regardless of the number of pages or how complex the data being presented is.

We hope you find this project useful whether you're building a small personal blog or a flagship SEO site that impacts millions of users. 


## Full documentation here: https://elderguide.com/tech/elderjs/
