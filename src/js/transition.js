/**
 * Transition plugin.
 *
 * @package Fundament
 */
;(function($) {
    'use strict';

    var Name = 'transition';

    var Defaults = {
        duration : 280,
        delay    : 0,
        curve    : 'ease',
        queue    : true,
        onStart  : function() {},
        onEnd    : function() {}
    };

    // Globals

    var transitionEnd = Fm.transitionEnd();

    // Constructor

    function Transition(element, animation, settings, onEnd) {
        var self = this;

        self.config = $.extend({}, $.fn[Name].defaults, settings);
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

    // Prototype

    $.extend(Transition.prototype, {

        init: function(animation) {
            var self   = this,
                config = self.config;

            self.animation = self.parse(animation);

            if (self.animation === 'display') {
                return self.end();
            } else if ( ! config.animations.hasOwnProperty(self.animation)) {
                return console.warn('Trying to call an undefined animation');
            }

            if (transitionEnd) {
                self.$elem
                    .off(transitionEnd) // prevent any interruptions
                    .one(transitionEnd, function(e) {
                        e.stopPropagation(); // prevent event bubbling
                        self.end();
                    });
            } else {
                // Set a timer which functions as a fallback for the
                // unsupported transitionEnd event.
                setTimeout(self.end.bind(self), config.duration + config.delay);
            }


            // Create a separate queue entry to make sure previous
            // re-draw events are finished. This also notifies the
            // browser that the element is soon going to be animated.
            var fire = function() {
                requestAnimationFrame(self.start.bind(self));
            };

            config.delay ? fire() : setTimeout(fire, config.delay);
        },

        /**
         * Parses the animation and determines the transition direction.
         * Returns the base name of the animation.
         *
         * @param {string} animation
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
         * @param {string} state
         */
        style: function(state) {
            var self = this,
                animation = self.config.animations[self.animation],
                direction = self.direction,
                css;

            if (state === 'start') {
                css = (direction === 'inward') ?
                    animation.start:
                    animation.end; // reversed

                css.transition = null;
            } else {
                css = (direction === 'inward') ?
                    animation.end:
                    animation.start; // reversed

                css.transition = 'all ' +
                    self.config.duration + 'ms ' +
                    self.config.curve;
            }

            for (var prop in css) {
                var prefixed = Fm.prefixProp(prop); // prefix attributes
                if (prefixed !== prop)
                    css[prefixed] = css[prop];
            }

            return css;
        }
    });

    // Plugin

    $.fn[Name].defaults = Defaults;
    $.fn[Name] = function(animation, settings, onEnd) {
        return this.each(function() {
            new Transition(this, animation, settings, onEnd);
        });
    };

    $.fn[Name].defaults.animations = {
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
        slideUp: {
            start : { 'opacity': 0.2, 'transform': 'scaleY(0.01)', 'transform-origin': 'bottom'},
            end   : { 'opacity': 1, 'transform': 'scaleY(1)', 'transform-origin': 'bottom'}
        },
        slideDown: {
            start : { 'opacity': 0.2, 'transform': 'scaleY(0.01)', 'transform-origin': 'top'},
            end   : { 'opacity': 1, 'transform': 'scaleY(1)', 'transform-origin': 'top'}
        },
        flipX: {
            start : { 'opacity': 0, 'transform': 'perspective(2000px) rotateY(-90deg)' },
            end   : { 'opacity': 1, 'transform': 'perspective(2000px) rotateY(0deg)' }
        },
        flipY: {
            start : { 'opacity': 0, 'transform': 'perspective(2000px) rotateX(-90deg)' },
            end   : { 'opacity': 1, 'transform': 'perspective(2000px) rotateX(0deg)' }
        }
    };

})(jQuery);
