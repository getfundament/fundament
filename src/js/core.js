/*!
 * Fundament framework v0.1.0
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
 * Fundament utility functions.
 *
 * @package Fundament
 */
var fm = (function(document) {

    var cssPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'],
        cssDeclaration = document.createElement('div').style;

    /**
     * Shorthand function to rapidly iterate over arrays and objects.
     *
     * @param iteratable
     * @param callback
     */
    var each = function(iteratable, callback) {
        var i = 0;
        if (iteratable.constructor === Array) {
            for (i; i < iteratable.length; i++) {
                callback(iteratable[i], i);
            }
        } else if (iteratable === Object(iteratable)) {
            for (var key in iteratable) {
                if (iteratable.hasOwnProperty(key)) {
                    callback(key, iteratable[key], i);
                    i++;
                }
            }
        }
    };

    /**
     * Debounces a function which will be called after it stops being
     * called for x milliseconds. If 'immediate' is passed, trigger
     * the function on the leading edge, instead of the trailing.
     *
     * @param {Function} func
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
     * Determine whether the node contains a certain class.
     *
     * @param {HTMLElement} elem
     * @param {string} className
     * @return {boolean}
     */
    var hasClass = function(elem, className) {
        return elem.classList.contains(className);
    };

    /**
     * Toggles a class on the node.
     *
     * @param {HTMLElement} element
     * @param {string} className
     */
    var toggleClass = function(element, className) {
        element.classList.toggle(className);
    };

    /**
     * Add a class to the node.
     *
     * @param {HTMLElement} element
     * @param {string} className
     */
    var addClass = function(element, className) {
        element.classList.add(className);
    };

    /**
     * Remove a class from the node.
     *
     * @param {HTMLElement} element
     * @param {string} className
     */
    var removeClass = function(element, className) {
        element.classList.remove(className);
    };

    /**
     * Returns a prefixed css property.
     *
     * @param {string} prop
     * @returns {string}
     */
    var prefix = function(prop) {
        if (cssDeclaration[prop] === undefined) {
            each(cssPrefixes, function(key, value) {
                var prefixed = value + prop;
                if (cssDeclaration[prefixed] !== undefined) {
                    prop = prefixed;
                }
            });
        }

        return prop;
    };

    /**
     * Add an event listener that fires just once.
     *
     * @param {HTMLElement} elem
     * @param {string} type
     * @param {EventListener|Function} listener
     */
    var once = function(elem, type, listener) {
        elem.addEventListener(type, function func(event) {
            elem.removeEventListener(type, func);
            listener(event);
        });
    };

    /**
     * Add or remove css properties from a node.
     *
     * @param {HTMLElement} elem
     * @param {Object} css
     */
    var css = function(elem, css) {
        if (css === Object(css)) {
            each(css, function(prop, value) {
                elem.style[prop] = value;
            });
        }
    };

    /**
     * Determine whether the element matches a certain selector.
     *
     * @param {HTMLElement} elem
     * @param {string} selector
     * @return {boolean}
     */
    var is = function(elem, selector) {
        return (elem.matches
            || elem.matchesSelector
            || elem.msMatchesSelector
            || elem.mozMatchesSelector
            || elem.webkitMatchesSelector
            || elem.oMatchesSelector
        ).call(elem, selector);
    };

    /**
     * Generate a fairly random unique identifier.
     *
     * @returns {string}
     */
    var createID = function() {
        return (Math.random().toString(16) + '000000000').substr(2,8);
    };

    /**
     * Returns the supported transitionEnd event or false.
     *
     * @returns {string|boolean}
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

        return false;
    };

    // Publicly accessible
    return {
        each: each,
        debounce: debounce,
        prefix: prefix,
        hasClass: hasClass,
        once: once,
        css: css,
        is: is,
        createID: createID,
        transitionEnd: transitionEnd
    };

})(document);
