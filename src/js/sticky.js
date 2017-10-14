/**
 * Sticky plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var Name = 'sticky';

    var Defaults = {
        context      : null,
        mask         : true,
        observe      : false,
        topOffset    : 0,
        bottomOffset : 0,
        scrollSpace  : 200,
        onStick      : function() {},
        onUnStick    : function() {},
        onBound      : function() {},
        onUnBound    : function() {}
    };

    var ClassNames = {
        mask  : 'sticky-mask',
        stick : 'stick',
        bound : 'bound'
    };

    var Selectors = {
        mask : '.sticky-mask'
    };

    // Globals

    var $window = $(window);

    var windowHeight = $window.height();

    // Constructor

    function Sticky(element, settings) {
        this.namespace = '.' + Name + '.' + Fm.createID();
        this.config    = $.extend({}, $.fn[Name].defaults, settings);
        this.elem      = element;
        this.$elem     = $(element);
        this.$context  = this.$elem.closest(this.config.context);
        this.calc      = {};
        this.isStick   = false;
        this.isBound   = false;
        this.recalc    = Fm.debounce(this.calculate.bind(this), 200);

        // initialize as soon as the document and
        // its content have finished loading
        $window.on('load', this.init.bind(this));
    }

    // Prototype

    $.extend(Sticky.prototype, {

        init: function() {
            if ( ! this.$context.length) {
                return console.warn('Undefined context element');
            }

            this.bind();
            this.observe();
            this.calculate();
        },

        /**
         * Pre-calculate sizes and positions.
         *
         * Executed during initialization, while resizing and after mutation (optional).
         */
        calculate: function() {
            var self = this,
                calc = self.calc;

            windowHeight = $window.height();

            if (self.isStick) {
                self.make('unStick');
            }

            calc.contextOffset = self.$context.offset();
            calc.contextHeight = self.$context.outerHeight();
            calc.elemOffset = self.$elem.offset();
            calc.elemSize = {
                width  : self.$elem.outerWidth(),
                height : self.$elem.outerHeight()
            };

            if (calc.elemSize.height + self.config.scrollSpace >= calc.contextHeight) {
                console.warn('Insufficient scrolling space available');
                return this.destroy();
            }

            self.setBounds();

            requestAnimationFrame(self.update.bind(self));
        },

        /**
         * Set the sticky boundaries.
         */
        setBounds: function() {
            var self = this,
                calc = self.calc,
                conf = self.config;

            calc.bounds = {
                top    : calc.elemOffset.top - conf.topOffset,
                bottom : calc.contextOffset.top + calc.contextHeight - conf.bottomOffset
            };

            if (calc.elemSize.height > windowHeight) { // oversized content
                calc.overSized = calc.elemSize.height - windowHeight + conf.bottomOffset;
                calc.bounds.top += calc.overSized + conf.topOffset;
                calc.bounds.bottom += conf.topOffset;
            } else {
                calc.overSized = 0;
            }
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
                .off('resize' + this.namespace)
                .off('scroll' + this.namespace);
        },

        /**
         * Check if the sticky element's state needs to be changed.
         */
        update: function() {
            var self = this,
                calc = self.calc,
                scrollTop = window.pageYOffset,
                elemBottom = scrollTop
                    + self.config.topOffset
                    + calc.elemSize.height
                    - calc.overSized;

            if (
                ! self.isStick                           // is not sticky
                && scrollTop >= calc.bounds.top          // passed top boundary
            ) {
                self.make('stick');

                if (elemBottom >= calc.bounds.bottom) {
                    self.make('bound'); // fail-safe
                }
            }
            else if (
                self.isStick                             // is sticky
                && scrollTop < calc.bounds.top           // didn't pass top boundary
            ) {
                self.make('unStick');
            }
            else if (
                ! self.isBound                           // is not bound
                && elemBottom >= calc.bounds.bottom      // passed bottom boundary
            ) {
                self.make('bound');
            }
            else if (
                self.isBound                             // is bound
                && elemBottom < calc.bounds.bottom       // didn't pass bottom boundary
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
                        top       : calc.overSized ? -calc.overSized : self.config.topOffset, // oversized content has a negative top
                        bottom    : '',
                        width     : calc.elemSize.width
                    });
                    self.isStick = true;
                },

                stick: function() {
                    self.make('fixed');
                    self.mask('show');
                    self.$elem.addClass(ClassNames.stick);
                    self.config.onStick.call(self.elem);
                },

                unStick: function() {
                    self.clear();
                    self.mask('hide');
                    self.isBound = false;
                    self.isStick = false;
                    self.config.onUnStick.call(self.elem);
                },

                bound: function() {
                    self.$elem
                        .css({
                            position : 'absolute',
                            top      : '',
                            bottom   : self.config.bottomOffset
                        })
                        .addClass(ClassNames.bound);
                    self.isBound = true;
                    self.config.onBound.call(self.elem);
                },

                unBound: function() {
                    self.make('fixed');
                    self.$elem.removeClass(ClassNames.bound);
                    self.isBound = false;
                    self.config.onUnBound.call(self.elem);
                }
            }[state].apply(self);
        },

        /**
         * Perform an action for the mask element.
         *
         * @param {string} action
         */
        mask: function(action) {
            var self = this,
                calc = self.calc,
                $mask = this.$elem.next(Selectors.mask);

            if ( ! self.config.mask) {
                return;
            }

            return {
                show: function() {
                    if ($mask.length) {
                        $mask.css({ // show existing
                            width  : calc.elemSize.width,
                            height : calc.elemSize.height
                        }).show();
                    } else {
                        $('<div/>', { // create new
                            class : ClassNames.mask,
                            css   : {
                                width  : calc.elemSize.width,
                                height : calc.elemSize.height
                            }
                        }).insertAfter(self.$elem);
                    }
                },

                hide: function() {
                    $mask.hide();
                },

                remove: function() {
                    $mask.remove();
                }
            }[action].apply(self);
        },

        /**
         * Clear sticky styles and classes.
         */
        clear: function() {
            this.$elem
                .css({
                    position  : '',
                    top       : '',
                    bottom    : '',
                    width     : ''
                })
                .removeClass(
                    ClassNames.stick + ' ' +
                    ClassNames.bound
                );
        },

        /**
         * Observe DOM changes.
         */
        observe: function() {
            if ( ! this.config.observe || ! 'MutationObserver' in window) {
                return;
            }

            this.observer = new MutationObserver(this.recalc);
            this.observer.observe(this.elem, {
                childList : true,
                subtree   : true
            });

            this.contextObserver = new MutationObserver(this.recalc);
            this.contextObserver.observe(this.$context[0], {
                childList : true,
                subtree   : true
            });
        },

        /**
         * Override the instance's settings.
         *
         * @param {Object} settings
         */
        setting: function(settings) {
            $.extend(this.config, settings);
        },

        /**
         * Destroy the instance.
         */
        destroy: function() {
            if (this.hasOwnProperty('observer')) {
                this.observer.disconnect();
                this.contextObserver.disconnect();
            }

            this.unbind();
            this.clear();
            this.mask('remove');

            $.data(this.elem, Name, null); // unset data
        }

    });

    // Plugin

    $.fn[Name].defaults = Defaults;
    $.fn[Name] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, Name);

            if ( ! data) {
                $.data(this, Name, new Sticky(this, settings));
            } else if (typeof settings === 'string' && data[settings]) {
                data[settings].apply(data, Array.isArray(args) ? args : [args]);
            }
        });
    };


})(jQuery, window, document);
