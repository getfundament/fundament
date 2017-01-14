/**
 * Transition plugin.
 *
 * @package Fundament
 */
;(function($) {
    'use strict';

    var plugin = 'transition';

    var transitionEndEvent = Fm.transitionEnd();

    // Constructors
    function Transition(element, animation, settings, onEnd) {
        var self = this;

        self.config = $.extend({}, $.fn[plugin].defaults, settings);
        self.elem   = element;
        self.$elem  = $(element);

        if (typeof onEnd === 'function')
            self.config.onEnd = onEnd; // onEnd shorthand
        if (settings == parseInt(settings))
            self.config.duration = settings; // duration shorthand
        else if (typeof settings === 'function')
            self.config.onEnd = settings; // onEnd shorthand

        (self.config.queue) ?
            self.$elem.queue(function() {
                self.init(animation);
            }): self.init(animation);
    }

    // Instance
    $.extend(Transition.prototype, {

        init: function(animation) {
            var self   = this,
                config = self.config;

            self.animation = self.parse(animation);

            if (self.animation == 'display') {
                return self.end();
            } else if ( ! config.animations.hasOwnProperty(self.animation)) {
                return console.warn('Trying to call an undefined animation');
            }

            if (transitionEndEvent) {
                self.$elem.one(transitionEndEvent, function(e) {
                    e.stopPropagation(); // prevent event bubbling
                    self.end();
                });
            } else {
                // Set a timer which functions as a fallback for the
                // unsupported transitionEnd event.
                setTimeout(self.end.bind(self), config.duration + config.delay);
            }

            if (config.delay == 0) {
                // Create a separate queue entry to make sure previous
                // re-draw events are finished. This also notifies the
                // browser that the element is soon going to be animated.
                requestAnimationFrame(self.start.bind(self));
            } else {
                setTimeout(function() {
                    requestAnimationFrame(self.start.bind(self));
                }, config.delay);
            }
        },

        /**
         * Parses the animation and determines the transition direction.
         * Returns the base name of the animation.
         *
         * @param animation
         * @return {string}
         */
        parse: function(animation) {
            if (animation.slice(-2) === 'In') {
                this.direction = 'inward';
                animation = animation.slice(0, -2);
            } else if (animation.slice(-3) === 'Out') {
                this.direction = 'outward';
                animation = animation.slice(0, -3);
            } else {
                this.direction = this.$elem.is(':visible') ? // toggle
                    'outward':
                    'inward' ;
            }

            return animation;
        },

        /**
         * Start the transition.
         */
        start: function() {
            var self = this;

            self.config.onStart.call(self.elem);

            self.$elem
                .css(self.style('start')) // apply start CSS
                .show(); // ensure visibility

            requestAnimationFrame(function() {
                self.$elem.css(self.style('end')); // apply end CSS
            });
        },

        /**
         * End the transition.
         */
        end: function() {
            var self  = this;

            self.toggleDisplay();

            self.config.onEnd.call(self.elem);

            self.$elem.css({
                'opacity'          : '',
                'transform'        : '',
                'transform-origin' : '',
                'transition'       : ''
            });

            if (self.config.queue)
                requestAnimationFrame(function() {
                    self.$elem.dequeue();
                });
        },

        /**
         * Toggle the display.
         */
        toggleDisplay: function() {
            this.direction === 'inward' ?
                this.$elem.show():
                this.$elem.hide();

            if (this.elem.hasAttribute('aria-hidden')) {
                this.$elem.attr('aria-hidden', this.direction !== 'inward');
            }
        },

        /**
         * Get the inline style for the transition.
         *
         * @param state
         */
        style: function(state) {
            var self      = this,
                animation = self.config.animations[self.animation],
                direction = self.direction,
                css       = {};

            if (state === 'start') {
                css = (direction == 'inward') ?
                    animation.start:
                    animation.end; // reversed

                css['transition'] = 'all ' +
                    self.config.duration + 'ms ' +
                    self.config.curve;
            } else {
                css = (direction == 'inward') ?
                    animation.end:
                    animation.start; // reversed

                css['transition'] = null;
            }

            for (var attr in css) {
                var prefixed = Fm.prefixAttr(attr); // prefix attributes
                if (prefixed !== attr)
                    css[prefixed] = css[attr];
            }

            return css;
        }
    });

    // Plugin definition
    $.fn[plugin] = function(animation, settings, onEnd) {
        return this.each(function() {
            new Transition(this, animation, settings, onEnd);
        });
    };

    // Default settings
    $.fn[plugin].defaults = {
        duration : 300,
        delay    : 0,
        curve    : 'ease',
        queue    : true,
        onStart  : function() {},
        onEnd    : function() {}
    };

    $.fn[plugin].defaults.animations = {
        // fade
        fade: {
            start : { 'opacity': 0 },
            end   : { 'opacity': 1 }
        },
        fadeUp: {
            start : { 'opacity': 0, 'transform': 'translateY(10%)' },
            end   : { 'opacity': 1, 'transform': 'translateY(0)' }
        },
        fadeDown: {
            start : { 'opacity': 0, 'transform': 'translateY(-10%)' },
            end   : { 'opacity': 1, 'transform': 'translateY(0)' }
        },

        // scale
        scale: {
            start : { 'opacity': 0, 'transform': 'scale(0.6)' },
            end   : { 'opacity': 1, 'transform': 'scale(1.0)' }
        },
        scaleUp: {
            start : { 'opacity': 0, 'transform': 'scale(0.6)', 'transform-origin': 'bottom' },
            end   : { 'opacity': 1, 'transform': 'scale(1.0)', 'transform-origin': 'bottom' }
        },
        scaleDown: {
            start : { 'opacity': 0, 'transform': 'scale(0.6)', 'transform-origin': 'top' },
            end   : { 'opacity': 1, 'transform': 'scale(1.0)', 'transform-origin': 'top' }
        },

        // slide
        slideUp: {
            start : { 'opacity': 0, 'transform': 'scaleY(0.01)', 'transform-origin': 'bottom'},
            end   : { 'opacity': 1, 'transform': 'scaleY(1)', 'transform-origin': 'bottom'}
        },
        slideDown: {
            start : { 'opacity': 0, 'transform': 'scaleY(0.01)', 'transform-origin': 'top'},
            end   : { 'opacity': 1, 'transform': 'scaleY(1)', 'transform-origin': 'top'}
        },

        // flip
        flip: {
            start : { 'opacity': 0, 'transform': 'perspective(2000px) rotateY(-90deg)' },
            end   : { 'opacity': 1, 'transform': 'perspective(2000px) rotateY(0deg)' }
        }
    };

})(jQuery);
