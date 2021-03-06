/**
 * Popup plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var Name = 'popup';

    var Defaults = {
        trigger    : 'hover',
        transition : 'display',
        direction  : 'southwest',
        delay      : 100,
        distance   : 10,
        hoverable  : false,
        onShow     : function() {},
        onHide     : function() {}
    };

    var ClassNames = {
        popup : 'popup'
    };

    var Selectors = {
        popup : '.popup'
    };

    // Globals

    var $window = $(window),
        $body   = $(document.body);

    // Constructor

    function Popup(element, settings) {
        this.namespace = '.' + Name + '.' + Fm.createID();
        this.config    = $.extend({}, $.fn[Name].defaults, settings);
        this.elem      = element;
        this.$elem     = $(element);
        this.$popup    = this.$elem.next(Selectors.popup);
        this.calc      = null;
        this.timer     = null;
        this.active    = false;
        this.init();
    }

    // Prototype

    $.extend(Popup.prototype, {

        init: function() {
            if ( ! this.$popup.length) {
                this.create();
            } else {
                // make sure the popup is a direct child
                // of the body for absolute positioning
                this.$popup
                    .detach()
                    .appendTo($body);
            }

            this.bind();
        },

        /**
         * Toggle the popup.
         *
         * @public
         */
        toggle: function() {
            this.active ?
                this.hide():
                this.show();
        },

        /**
         * Show the popup.
         *
         * @public
         */
        show: function() {
            var self = this,
                conf = self.config;

            clearTimeout(self.timer);

            if ( ! self.active) {
                self.position();
                self.timer = setTimeout(function() {
                    self.active = true;
                    self.$popup.transition(conf.transition + 'In', {
                        queue: false,
                        onEnd: conf.onShow.bind(self.elem)
                    });
                }, conf.delay.show || conf.delay);
            }
        },

        /**
         * Hide the popup.
         *
         * @public
         */
        hide: function() {
            var self = this,
                conf = self.config;

            clearTimeout(self.timer);

            if (self.active) {
                self.timer = setTimeout(function() {
                    self.active = false;
                    self.$popup.transition(conf.transition + 'Out', {
                        queue: false,
                        onEnd: conf.onHide.bind(self.elem)
                    });
                }, conf.delay.hide || conf.delay);
            }
        },

        /**
         * Override the instance's settings.
         *
         * @public
         *
         * @param {Object} settings
         */
        setting: function(settings) {
            $.extend(this.config, settings);
        },

        /**
         * Destroy the instance.
         *
         * @public
         */
        destroy: function() {
            this.unbind();
            this.$popup.remove();

            $.data(this.elem, Name, null);
        },

        /**
         * Create and append a new popup element.
         */
        create: function() {
            var $popup = $('<div/>', {
                    class : ClassNames.popup,
                    html  : $('<div/>').html( this.$elem.attr('title') ).text()
                });

            $popup.appendTo($body);

            this.$elem.attr('title', null);

            this.$popup = $popup;
        },

        /**
         * Bind event handlers.
         */
        bind: function() {
            var self = this,
                namespace = self.namespace;

            switch (self.config.trigger) {
                case 'click':
                    self.$elem
                        .on('click' + namespace, self.toggle.bind(self));
                    break;
                case 'hover':
                    self.$elem
                        .add(self.config.hoverable ? self.$popup : null)
                        .on('mouseenter' + namespace, self.show.bind(self))
                        .on('mouseleave' + namespace, self.hide.bind(self));
                    break;
                case 'focus':
                    self.$elem
                        .on('focusin' + namespace, self.show.bind(self))
                        .on('focusout' + namespace, self.hide.bind(self));
                    break;
            }

            $window.on('resize' + namespace,
                Fm.debounce(self.hide.bind(self), 200, true) // hide to force recalculation
            );
        },

        /**
         * Unbind event handlers.
         */
        unbind: function() {
            var self = this,
                namespace = self.namespace;

            switch (self.config.trigger) {
                case 'click':
                    self.$elem
                        .off('click' + namespace);
                    break;
                case 'hover':
                    self.$elem
                        .add(self.config.hoverable ? self.$popup : null)
                        .off('mouseenter' + namespace)
                        .off('mouseleave' + namespace);
                    break;
                case 'focus':
                    self.$elem
                        .off('focusin' + namespace)
                        .off('focusout' + namespace);
                    break;
            }

            $window.off('resize' + namespace);
        },

        /**
         * Make cached calculations if needed.
         *
         * @return {boolean}
         */
        calculate: function() {
            var offset = this.$elem.offset();

            if (
                this.calc
                && this.calc.elem.top === offset.top
                && this.calc.elem.left === offset.left
            ) {
                return false; // no need to position
            }

            this.calc = {
                elem : {
                    width  : this.$elem.outerWidth(),
                    height : this.$elem.outerHeight(),
                    top    : offset.top,
                    left   : offset.left
                },
                popup : {
                    width  : this.$popup.outerWidth(),
                    height : this.$popup.outerHeight()
                }
            };

            return true; // popup needs te be positioned
        },

        /**
         * (Re)position the popup element.
         */
        position: function() {
            if ( ! this.calculate())
                return; // nothing changed

            var self        = this,
                calc        = self.calc,
                direction   = self.$elem.data('direction') || self.config.direction,
                distance    = self.config.distance,
                positioning = {};

            switch (direction) {
                case 'north':
                    positioning = {
                        top  : calc.elem.top - calc.popup.height - distance,
                        left : calc.elem.left + (calc.elem.width / 2) - (calc.popup.width / 2)
                    };
                    break;
                case 'northeast':
                    positioning = {
                        top  : calc.elem.top - calc.popup.height - distance,
                        left : calc.elem.left + calc.elem.width - calc.popup.width
                    };
                    break;
                case 'east':
                    positioning = {
                        top  : calc.elem.top + (calc.elem.height / 2) - (calc.popup.height / 2),
                        left : calc.elem.left + calc.elem.width + distance
                    };
                    break;
                case 'southeast':
                    positioning = {
                        top  : calc.elem.top + calc.elem.height + distance,
                        left : calc.elem.left + calc.elem.width - calc.popup.width
                    };
                    break;
                case 'south':
                    positioning = {
                        top  : calc.elem.top + calc.elem.height + distance,
                        left : calc.elem.left + (calc.elem.width / 2) - (calc.popup.width / 2)
                    };
                    break;
                case 'southwest':
                    positioning = {
                        top  : calc.elem.top + calc.elem.height + distance,
                        left : calc.elem.left
                    };
                    break;
                case 'west':
                    positioning = {
                        top  : calc.elem.top + (calc.elem.height / 2) - (calc.popup.height / 2),
                        left : calc.elem.left - calc.popup.width - distance
                    };
                    break;
                case 'northwest':
                    positioning = {
                        top  : calc.elem.top - calc.popup.height - distance,
                        left : calc.elem.left
                    };
                    break;
            }

            self.$popup
                .css(positioning)
                .addClass(ClassNames.popup + '--' + direction);
        }

    });

    // Plugin

    $.fn[Name] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, Name);

            if ( ! data) {
                $.data(this, Name, new Popup(this, settings));
            } else if (typeof settings === 'string' && data[settings]) {
                data[settings].apply(data, Array.isArray(args) ? args : [args]);
            }
        });
    };

    $.fn[Name].defaults = Defaults;

})(jQuery, window, document);
