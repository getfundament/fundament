/**
 * Sticky plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var plugin    = 'sticky',
        methods   = ['calculate', 'destroy'],
        namespace = '.' + plugin;

    var $window = $(window),
        windowHeight = $window.height();

    // Constructor
    function Sticky(element, settings) {
        this.namespace = namespace + '.' + Fm.createID();
        this.config    = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem      = element;
        this.$elem     = $(element);
        this.calc      = {};
        this.isStick   = false;
        this.isBound   = false;
        this.recalc    = Fm.debounce(this.calculate.bind(this), 200);
        this.init();
    }

    // Instance
    $.extend(Sticky.prototype, {

        init: function() {
            this.calculate();
            this.bind();

            if (this.config.observe) {
                this.observe();
            }
        },

        /**
         * Pre-calculate sizes and positions.
         *
         * Executed during initialization, while resizing and after mutation (optional).
         */
        calculate: function() {
            var self = this,
                calc = this.calc,
                $context = self.config.context;

            windowHeight = $window.height();

            if (self.isStick) {
                self.make('unStick');
            }

            calc.elemOffset = self.$elem.offset();
            calc.elemSize = {
                width  : self.$elem.outerWidth(),
                height : self.$elem.outerHeight()
            };

            calc.boundaries = {
                top    : calc.elemOffset.top - self.config.topOffset,
                bottom : ($context.is(document) ?
                    $context.height() :
                    $context.offset().top + $context.outerHeight()
                ) - self.config.bottomOffset
            };

            requestAnimationFrame(self.update.bind(self));
        },

        /**
         * Bind event handlers.
         */
        bind: function() {
            var self = this;

            $window
                .on('resize' + self.namespace, self.recalc)
                .on('scroll' + self.namespace, function() {
                    requestAnimationFrame(self.update.bind(self));
                });
        },

        /**
         * Unbind event handlers.
         */
        unbind: function() {
            $window
                .off('scroll' + this.namespace)
                .off('resize' + this.namespace);
        },

        /**
         * Check if the sticky element's state needs to be changed.
         */
        update: function() {
            var self       = this,
                scrollTop  = window.pageYOffset,
                elemBottom = scrollTop
                    + self.config.topOffset
                    + self.calc.elemSize.height;

            if (
                ! self.isStick                                    // is not sticky
                && scrollTop >= self.calc.boundaries.top          // passed top boundary
            ) {
                self.make('stick');

                if (
                    self.isBound                                  // is bound
                    && elemBottom >= self.calc.boundaries.bottom  // passed bottom boundary
                ) {
                    self.make('bound'); // fail-safe when recalculating
                }
            }
            else if (
                self.isStick                                      // is sticky
                && scrollTop < self.calc.boundaries.top           // didn't pass top boundary
            ) {
                self.make('unStick');
            }
            else if (
                ! self.isBound                                    // is not bound
                && elemBottom >= self.calc.boundaries.bottom      // passed bottom boundary
            ) {
                self.make('bound');
            }
            else if (
                self.isBound                                      // is bound
                && elemBottom < self.calc.boundaries.bottom       // didn't pass bottom boundary
            ) {
                self.make('unBound');
            }
        },

        /**
         * Set the state of the sticky element.
         *
         * @param {string} state
         */
        make: function(state) {
            var self = this,
                calc = self.calc;

            return {
                fixed: function() {
                    self.$elem.css({
                        position  : 'fixed',
                        top       : calc.elemOffset.top > self.config.topOffset ? self.config.topOffset : calc.elemOffset.top,
                        left      : calc.elemOffset.left,
                        width     : calc.elemSize.width,
                        transform : 'translateZ(0)'
                    });
                },

                stick: function() {
                    self.make('fixed');
                    self.$elem.addClass(self.config.classNames.stick);

                    self.mask(true);

                    self.isStick = true;
                    self.config.onStick.call(self.elem);
                },

                unStick: function() {
                    self.$elem
                        .css({
                            position  : '',
                            top       : '',
                            left      : '',
                            width     : '',
                            transform : ''
                        })
                        .removeClass(self.config.classNames.stick);

                    self.mask().hide();

                    self.isStick = false;
                    self.config.onUnStick.call(self.elem);
                },

                bound: function() {
                    self.$elem
                        .css({
                            position : 'absolute',
                            top      : calc.boundaries.bottom - calc.elemSize.height + 'px'
                        })
                        .addClass(self.config.classNames.bound);

                    self.isBound = true;
                    self.config.onBound.call(self.elem);
                },

                unBound: function() {
                    self.make('fixed');
                    self.$elem.removeClass(self.config.classNames.bound);

                    self.isBound = false;
                    self.config.onUnBound.call(self.elem);
                }
            }[state].apply(this);
        },

        /**
         * Get or show the mask for the sticky element.
         *
         * @param {boolean} show
         */
        mask: function(show) {
            var $mask = this.$elem.next('.' + this.config.classNames.mask);

            if ( ! show)
                return $mask; // return existing

            if ($mask.length) {
                $mask.css({ // show existing
                    width  : this.calc.elemSize.width,
                    height : this.calc.elemSize.height
                }).show();
            }
            else {
                $('<div/>', { // create new
                    class : this.config.classNames.mask,
                    css   : {
                        width  : this.calc.elemSize.width,
                        height : this.calc.elemSize.height
                    }
                }).insertAfter(this.$elem);
            }
        },

        /**
         * Observe DOM changes.
         */
        observe: function() {
            if ('MutationObserver' in window) {
                this.observer = new MutationObserver(this.recalc);
                this.observer.observe(this.elem, {
                    childList : true,
                    subtree   : true
                });

                this.contextObserver = new MutationObserver(this.recalc);
                this.contextObserver.observe(this.config.context[0], {
                    childList : true,
                    subtree   : true
                });
            }
        },

        /**
         * Destroy the instance.
         */
        destroy: function() {
            var self = this;

            if (self.hasOwnProperty('observer')) {
                self.observer.disconnect();
                self.contextObserver.disconnect();
            }

            self.unbind(); // unbind event handlers

            self.$elem // clear styling
                .css({
                    position : '',
                    top      : '',
                    left     : '',
                    width    : ''
                })
                .removeClass(
                    self.config.classNames.stick + ' ' +
                    self.config.classNames.bound
                );

            self.mask().remove(); // remove mask

            $.data(self.elem, plugin, null); // unset data
        }

    });

    // Plugin definition
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, plugin);

            if ( ! data) {
                $.data(this, plugin, new Sticky(this, settings));
            }
            else if (typeof settings === 'string') {
                methods.indexOf(settings) > -1 ?
                    data[settings].apply(data, $.isArray(args) ? args : [args]):
                    console.warn(plugin + ': Trying to call a inaccessible method');
            }
        });
    };

    // Default settings
    $.fn[plugin].defaults = {
        context      : $(document),
        mask         : true,
        observe      : false,
        topOffset    : 0,
        bottomOffset : 0,
        classNames : {
            stick  : 'stick',
            bound  : 'bound',
            mask   : 'sticky-mask'
        },
        onStick   : function() {},
        onUnStick : function() {},
        onBound   : function() {},
        onUnBound : function() {}
    };

})(jQuery, window, document);
