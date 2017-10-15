/*!
 * Fundament framework v0.3.5
 *
 * https://getfundament.com
 *
 * @license MIT
 * @author Jason Koolman and The Fundament Authors
 */
window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||window.oRequestAnimationFrame||function(n){setTimeout(n,0)};var Fm=function(n){function i(){return(Math.random().toString(16)+"000000000").substr(2,8)}function t(n,i,t){var e;return function(){var o=this,r=arguments,a=t&&!e,u=function(){e=null,t||n.apply(o,r)};clearTimeout(e),e=setTimeout(u,i),a&&n.apply(o,r)}}function e(n){if(void 0===a[n])for(var i=0;i<r.length;i++){var t=r[i]+n;void 0!==a[t]&&(n=t)}return n}function o(){var n={transition:"transitionend",OTransition:"otransitionend",MozTransition:"transitionend",WebkitTransition:"webkitTransitionEnd"};for(var i in n)if(void 0!==a[i])return n[i];return null}var r=["-webkit-","-moz-","-ms-","-o-"],a=n.createElement("div").style;return{createID:i,debounce:t,prefixProp:e,transitionEnd:o}}(document);
//# sourceMappingURL=core.js.map
