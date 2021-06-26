import { IComponentToHydrate } from '../utils/Page';

export default function hydrateComponent(component: IComponentToHydrate) {
  const hydrateInstructions = {
    rootMargin: '200px',
    threshold: 0,
    timeout: 1000,
    ...component.hydrateOptions,
  };

  if (hydrateInstructions.loading === 'eager') {
    return `
    <script type="module">
    ${
      component.prepared.clientPropsUrl
        ? `Promise.all([import("${component.client}"), import("${component.prepared.clientPropsUrl}")]).then(([component, props])=>{
          const ${component.name}Props =  props.default;`
        : `import("${component.client}").then((component)=>{
          const ${component.name}Props = ${component.prepared.clientPropsString || '{}'};`
    }
      new component.default({ 
        target: document.getElementById('${component.name}'),
        props: $ejs(${component.name}Props),
        hydrate: true
        });
    });
    </script>
    `;
  }

  return `
  <script type="module">
    ${
      hydrateInstructions.timeout > 0
        ? `requestIdleCallback(async function(){`
        : `window.addEventListener('load', async function (event) {`
    }
    ${
      component.prepared.clientPropsUrl
        ? `
      const propsFile = await import('${component.prepared.clientPropsUrl}');
      const ${component.name}Props = propsFile.default;
    `
        : `
      const ${component.name}Props = ${component.prepared.clientPropsString};    
    `
    }

      const init${component.name} = (props) => {
        import("${component.client}").then((component)=>{
          new component.default({ 
            target: document.getElementById('${component.name}'),
            props: $ejs(props),
            hydrate: true
            });
        });
      };
        var observer${component.id} = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(document.getElementById('${component.name}'));
              if (document.eg_${component.name}) {
                init${component.name}(${component.name}Props);
              } else {
                document.eg_${component.name} = true;
                init${component.name}(${component.name}Props);
              }
            }
          }
        }, {
          rootMargin: '${hydrateInstructions.rootMargin}',
          threshold: ${hydrateInstructions.threshold}
        });
        observer${component.id}.observe(document.getElementById('${component.name}'));
      ${hydrateInstructions.timeout > 0 ? `}, {timeout: ${hydrateInstructions.timeout}});` : '});'}

  </script>
    `;
}
