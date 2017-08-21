/*!
 * Fundament framework v0.3.2
 *
 * https://getfundament.com
 *
 * @license MIT
 * @author Jason Koolman and The Fundament Authors
 */

// Normalization
window.requestAnimationFrame = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.msRequestAnimationFrame
    || window.oRequestAnimationFrame
    || function(callback){ setTimeout(callback, 0) };

/**
 * Fundament global variables and utility functions.
 *
 * @package Fundament
 */
var Fm = (function(document) {

    var cssPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'],
        cssDeclaration = document.createElement('div').style;

    /**
     * Generate a fairly random unique identifier.
     *
     * @returns {string}
     */
    var createID = function() {
        return (Math.random().toString(16) + '000000000').substr(2,8);
    };

    /**
     * Debounces a function which will be called after it stops being
     * called for x milliseconds. If 'immediate' is passed, trigger
     * the function on the leading edge, instead of the trailing.
     *
     * @param {function} func
     * @param {int} wait
     * @param {boolean} immediate
     */
    var debounce = function(func, wait, immediate) {
        var timeout;

        return function() {
            var self    = this,
                args    = arguments,
                callNow = immediate && !timeout;

            var later = function() {
                timeout = null;

                if ( ! immediate)
                    func.apply(self, args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow)
                func.apply(self, args);
        };
    };

    /**
     * Returns a prefixed CSS property.
     *
     * @param {string} attr
     * @returns {string}
     */
    var prefixProp = function(attr) {
        if (cssDeclaration[attr] === undefined) {
            for (var i = 0; i < cssPrefixes.length; i++) {
                var prefixed = cssPrefixes[i] + attr;
                if (cssDeclaration[prefixed] !== undefined) {
                    attr = prefixed;
                }
            }
        }

        return attr;
    };

    /**
     * Returns the supported transitionEnd event.
     *
     * @returns {string|null}
     */
    var transitionEnd = function() {
        var events = {
            transition       : 'transitionend',
            OTransition      : 'otransitionend',
            MozTransition    : 'transitionend',
            WebkitTransition : 'webkitTransitionEnd'
        };

        for (var event in events) {
            if (cssDeclaration[event] !== undefined) {
                return events[event];
            }
        }

        return null;
    };

    return {
        createID: createID,
        debounce: debounce,
        prefixProp: prefixProp,
        transitionEnd: transitionEnd
    };

})(document);
