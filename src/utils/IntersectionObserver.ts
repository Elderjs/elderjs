import getUniqueId from './getUniqueId';

export default ({ el, name, loaded, notLoaded, distancePx = 200 }) => {
  const uid = getUniqueId();
  return /* javascript */ `

      window.addEventListener('load', function (event) {
        var observer${uid} = new IntersectionObserver(function(entries, observer) {
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
          rootMargin: '${distancePx}px',
          threshold: 0
        });
        observer${uid}.observe(${el});
      });
    `;
};
