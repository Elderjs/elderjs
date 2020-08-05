"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getUniqueId_1 = __importDefault(require("./getUniqueId"));
exports.default = ({ el, name, loaded, notLoaded, distancePx = 200 }) => {
    const uid = getUniqueId_1.default();
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
