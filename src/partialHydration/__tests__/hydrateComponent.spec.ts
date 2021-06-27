import hydrateComponent from '../hydrateComponent';

jest.mock('../../utils/getUniqueId', () => () => 'SwrzsrVDCd');

const removeWhitespace = (str) => str.replace(/\s+/g, '');

describe('#hydrateComponent', () => {
  test('timeout:0 = window.addEventListener(', () => {
    expect(
      removeWhitespace(
        hydrateComponent({
          name: 'foo-SwrzsrVDCd',
          id: 'SwrzsrVDCd',
          client: 'client.js',
          props: {},
          hydrateOptions: { timeout: 0 },
          prepared: {
            clientPropsString: 'propString',
          },
        }).trim(),
      ),
    ).toEqual(
      removeWhitespace(`<script type="module">
    window.addEventListener('load', async function (event) {
      const foo-SwrzsrVDCdProps = propString;
      const initfoo-SwrzsrVDCd = (props) => {
        import("client.js").then((component)=>{
          new component.default({
            target: document.getElementById('foo-SwrzsrVDCd'),
            props: $ejs(props),
            hydrate: true
            });
        });
      };
        var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(document.getElementById('foo-SwrzsrVDCd'));
              if (document.eg_foo-SwrzsrVDCd) {
                initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);
              } else {
                document.eg_foo-SwrzsrVDCd = true;
                initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);
              }
            }
          }
        }, {
          rootMargin: '200px',
          threshold: 0
        });
        observerSwrzsrVDCd.observe(document.getElementById('foo-SwrzsrVDCd'));
      });
  </script>`),
    );
  });

  test('timeout:2000 = requestIdleCallback', () => {
    expect(
      removeWhitespace(
        hydrateComponent({
          name: 'foo-SwrzsrVDCd',
          id: 'SwrzsrVDCd',
          client: 'client.js',
          props: {},
          hydrateOptions: { timeout: 2000 },
          prepared: {
            clientPropsString: 'propString',
          },
        }).trim(),
      ),
    ).toEqual(
      removeWhitespace(`<script type="module">
      requestIdleCallback(async function () {
      const foo-SwrzsrVDCdProps = propString;
      const initfoo-SwrzsrVDCd = (props) => {
        import("client.js").then((component)=>{
          new component.default({
            target: document.getElementById('foo-SwrzsrVDCd'),
            props: $ejs(props),
            hydrate: true
            });
        });
      };
        var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(document.getElementById('foo-SwrzsrVDCd'));
              if (document.eg_foo-SwrzsrVDCd) {
                initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);
              } else {
                document.eg_foo-SwrzsrVDCd = true;
                initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);
              }
            }
          }
        }, {
          rootMargin: '200px',
          threshold: 0
        });
        observerSwrzsrVDCd.observe(document.getElementById('foo-SwrzsrVDCd'));
      },{timeout:2000});
  </script>`),
    );
  });

  test('timeout not set = 1000', () => {
    expect(
      removeWhitespace(
        hydrateComponent({
          name: 'foo-SwrzsrVDCd',
          id: 'SwrzsrVDCd',
          client: 'client.js',
          props: {},
          hydrateOptions: {},
          prepared: {
            clientPropsString: 'propString',
          },
        }).trim(),
      ),
    ).toEqual(
      removeWhitespace(`<script type="module">
      requestIdleCallback(async function () {
      const foo-SwrzsrVDCdProps = propString;
      const initfoo-SwrzsrVDCd = (props) => {
        import("client.js").then((component)=>{
          new component.default({
            target: document.getElementById('foo-SwrzsrVDCd'),
            props: $ejs(props),
            hydrate: true
            });
        });
      };
        var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(document.getElementById('foo-SwrzsrVDCd'));
              if (document.eg_foo-SwrzsrVDCd) {
                initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);
              } else {
                document.eg_foo-SwrzsrVDCd = true;
                initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);
              }
            }
          }
        }, {
          rootMargin: '200px',
          threshold: 0
        });
        observerSwrzsrVDCd.observe(document.getElementById('foo-SwrzsrVDCd'));
      },{timeout:1000});
  </script>`),
    );
  });

  test('ClientPropsUrl', () => {
    expect(
      removeWhitespace(
        hydrateComponent({
          name: 'foo-SwrzsrVDCd',
          id: 'SwrzsrVDCd',
          client: 'client.js',
          props: {},
          hydrateOptions: {},
          prepared: {
            clientPropsUrl: 'module.js',
          },
        }).trim(),
      ),
    ).toEqual(
      removeWhitespace(
        `<scripttype="module">requestIdleCallback(asyncfunction(){constpropsFile=awaitimport('module.js');constfoo-SwrzsrVDCdProps=propsFile.default;constinitfoo-SwrzsrVDCd=(props)=>{import("client.js").then((component)=>{newcomponent.default({target:document.getElementById('foo-SwrzsrVDCd'),props:$ejs(props),hydrate:true});});};varobserverSwrzsrVDCd=newIntersectionObserver(function(entries,observer){varobjK=Object.keys(entries);varobjKl=objK.length;varobjKi=0;for(;objKi<objKl;objKi++){varentry=entries[objK[objKi]];if(entry.isIntersecting){observer.unobserve(document.getElementById('foo-SwrzsrVDCd'));if(document.eg_foo-SwrzsrVDCd){initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);}else{document.eg_foo-SwrzsrVDCd=true;initfoo-SwrzsrVDCd(foo-SwrzsrVDCdProps);}}}},{rootMargin:'200px',threshold:0});observerSwrzsrVDCd.observe(document.getElementById('foo-SwrzsrVDCd'));},{timeout:1000});</script>`,
      ),
    );
  });

  test('eager no ClientPropsUrl', () => {
    expect(
      removeWhitespace(
        hydrateComponent({
          name: 'foo-SwrzsrVDCd',
          id: 'SwrzsrVDCd',
          client: 'client.js',
          props: {},
          hydrateOptions: { loading: 'eager' },
          prepared: {
            clientPropsString: 'propString',
          },
        }).trim(),
      ),
    ).toEqual(
      removeWhitespace(
        `<scripttype="module">import("client.js").then((component)=>{constfoo-SwrzsrVDCdProps=propString;newcomponent.default({target:document.getElementById('foo-SwrzsrVDCd'),props:$ejs(foo-SwrzsrVDCdProps),hydrate:true});});</script>`,
      ),
    );
  });

  test('eager with ClientPropsUrl', () => {
    expect(
      removeWhitespace(
        hydrateComponent({
          name: 'foo-SwrzsrVDCd',
          id: 'SwrzsrVDCd',
          client: 'client.js',
          props: {},
          hydrateOptions: { loading: 'eager' },
          prepared: {
            clientPropsUrl: 'module.js',
          },
        }).trim(),
      ),
    ).toEqual(
      removeWhitespace(
        `<scripttype="module">Promise.all([import("client.js"),import("module.js")]).then(([component,props])=>{constfoo-SwrzsrVDCdProps=props.default;newcomponent.default({target:document.getElementById('foo-SwrzsrVDCd'),props:$ejs(foo-SwrzsrVDCdProps),hydrate:true});});</script>`,
      ),
    );
  });
});
