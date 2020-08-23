import { mocked } from 'ts-jest/utils';
import IntersectionObserver from '../IntersectionObserver';
import getUniqueId from '../getUniqueId';

jest.mock('../getUniqueId');

const mockedGetUniqueId = mocked(getUniqueId, true);
mockedGetUniqueId.mockImplementation(() => 'SwrzsrVDCd');

test('#IntersectionObserver', () => {
  expect(
    IntersectionObserver({
      el: 'targetElement',
      name: 'IntersectionObserver.spec.js',
      loaded: 'console.log("loaded");',
      notLoaded: 'console.log("not loaded");',
      id: mockedGetUniqueId(),
    }).trim(),
  ).toEqual(`window.addEventListener('load', function (event) {
        var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(targetElement);
              if (document.eg_IntersectionObserver.spec.js) {
                console.log("loaded");
              } else {
                document.eg_IntersectionObserver.spec.js = true;
                console.log("not loaded");
              }
            }
          }
        }, {
          rootMargin: '200px',
          threshold: 0
        });
        observerSwrzsrVDCd.observe(targetElement);
      });`);
});
