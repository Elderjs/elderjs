export default ({ el, name, loaded, notLoaded, id, rootMargin = '200px', threshold = 0 }) => {
  return `
      window.addEventListener('load', function (event) {
        var observer${id} = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(${el});
              if (document.eg_${name}) {
                ${loaded}
              } else {
                document.eg_${name} = true;
                ${notLoaded}
              }
            }
          }
        }, {
          rootMargin: '${rootMargin}',
          threshold: ${threshold}
        });
        observer${id}.observe(${el});
      });
    `;
};
