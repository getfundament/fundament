/*!
 * Fundament framework v0.3.2
 *
 * https://getfundament.com
 *
 * @license MIT
 * @author Jason Koolman and The Fundament Authors
 */

window.requestAnimationFrame = window.requestAnimationFrame
    || (<any>window).webkitRequestAnimationFrame
    || (<any>window).mozRequestAnimationFrame
    || (<any>window).msRequestAnimationFrame
    || (<any>window).oRequestAnimationFrame
    || function(callback){ setTimeout(callback, 0) };

/**
 * Fundament core utility functions.
 *
 * @package Fundament
 */
const Core = (($) => {

    let cssPrefixes: Array<string> = ['-webkit-', '-moz-', '-ms-', '-o-'],
        cssDeclaration: CSSStyleDeclaration = document.createElement('div').style;

    /**
     * Generate a fairly random unique identifier.
     *
     * @returns {string}
     */
    function createId(): string {
        return (Math.random().toString(16) + '000000000').substr(2,8);
    }

    /**
     * Debounces a function which will be called after it stops being
     * called for x milliseconds. If 'immediate' is passed, trigger
     * the function on the leading edge, instead of the trailing.
     *
     * @param {Function} func
     * @param {number} wait
     * @param {boolean} immediate
     */
    function debounce(func: Function, wait: number, immediate: boolean) {
        let timeout: number;

        return function() {
            const args = arguments,
                  call = immediate && !timeout;

            const later = () => {
                timeout = null;

                if ( ! immediate)
                    func.apply(this, args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (call)
                func.apply(this, args);
        };
    }

    /**
     * Returns a prefixed CSS property.
     *
     * @param {string} attr
     * @returns {string}
     */
    function prefixProp(attr: string): string {
        // if (cssDeclaration[attr] === undefined) {
        //     for (let i = 0; i < cssPrefixes.length; i++) {
        //         const prefixed = cssPrefixes[i] + attr;
        //         if (cssDeclaration[prefixed] !== undefined) {
        //             attr = prefixed;
        //         }
        //     }
        // }
        //
        // return attr;
        return '';
    }

    /**
     * Returns the supported transitionEnd event.
     *
     * @returns {string|null}
     */
    function transitionEnd(): string|null {
        const events = {
            transition       : 'transitionend',
            OTransition      : 'otransitionend',
            MozTransition    : 'transitionend',
            WebkitTransition : 'webkitTransitionEnd'
        };

        for (let event in events) {
            if (cssDeclaration[event] !== undefined) {
                return events[event];
            }
        }

        return null;
    }

    return {
        createId: createId,
        debounce: debounce,
        prefixProp: prefixProp,
        transitionEnd: transitionEnd
    };

})(jQuery);

export default Core;
