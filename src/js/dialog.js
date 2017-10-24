/**
 * Dialog plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var Name  = 'dialog';

    var Defaults = {
        openFrom   : null,
        closable   : true,
        autoFocus  : true,
        transition : 'scale',
        onOpen     : function() {},
        onOpening  : function() {},
        onClose    : function() {},
        onClosing  : function() {}
    };

    var ClassNames = {
        dimmer : 'page-dimmer',
        wrap   : 'dialog-wrap',
        active : 'is-active'
    };

    var Selectors = {
        dimmer : '.page-dimmer',
        block  : '.dialog__block',
        close  : '.dialog__close'
    };

    var Elements = {
        dimmer : $('<div/>', {class: ClassNames.dimmer}),
        wrap   : $('<div/>', {class: ClassNames.wrap, role: 'document'})
    };

    // Globals

    var $window   = $(window),
        $document = $(document),
        $body     = $(document.body);

    var transitionEnd = Fm.transitionEnd();

    // Constructor

    function Dialog(element, settings) {
        this.config  = $.extend({}, $.fn[Name].defaults, settings);
        this.elem    = element;
        this.$elem   = $(element);
        this.$dimmer = $(Selectors.dimmer);
        this.busy    = false;
        this.init();
    }

    // Prototype

    $.extend(Dialog.prototype, {

        init: function () {
            this.setup();
            this.bind();
        },

        /**
         * Toggle the dialog.
         *
         * @public
         */
        toggle: function () {
            this.$elem.is(':visible') ?
                this.close():
                this.open();
        },

        /**
         * Open the dialog.
         *
         * @public
         */
        open: function () {
            var self = this;

            if (self.busy) {
                return;
            }

            self.config.onOpening.call(self.elem);
            self.busy = true;

            self.scrollBar(false);
            self.$dimmer.show();
            self.$wrap.show();
            self.$dimmer.addClass(ClassNames.active);

            self.transition('In', function() { // show
                self.focus();
                self.config.onOpen.call(self.elem);
                self.busy = false;
            });
        },

        /**
         * Close the dialog.
         *
         * @public
         */
        close: function () {
            var self = this;

            if (self.busy) {
                return;
            }

            self.config.onClosing.call(self.elem);
            self.busy = true;

            self.transition('Out', function() { // hide
                self.$wrap.hide();
                self.$dimmer
                    .removeClass(ClassNames.active)
                    .one(transitionEnd, function() {
                        self.scrollBar(true);
                        self.$dimmer.hide();
                        self.config.onClose.call(self.elem);
                        self.busy = false;
                    });
            });
        },

        /**
         * Override the instance's settings.
         *
         * @public

         * @param {Object} settings
         */
        setting: function(settings) {
            $.extend(this.config, settings);
        },

        /**
         * Create and retrieve DOM elements.
         */
        setup: function() {
            var conf = this.config;

            if (this.$dimmer.length === 0) {
                this.$dimmer = $body
                    .append(Elements.dimmer) // append to body
                    .find(Selectors.dimmer); // retrieve
            }

            this.$wrap = this.$elem
                .wrap(Elements.wrap) // wrap around dialog
                .parent() // retrieve
                .hide();

            if (conf.openFrom) {
                conf.openFrom = $(conf.openFrom);
            }
        },

        /**
         * Bind event handlers.
         */
        bind: function() {
            var self = this,
                conf = self.config;

            self.$elem
                .on('click', Selectors.close, self.close.bind(self))
                .find(Selectors.block)
                .on(transitionEnd, function(e) {
                    e.stopPropagation(); // prevent event bubbling
                });

            if (conf.closable) {
                self.$wrap.on('click', function(e) {
                    if (e.target === this) self.close();
                });
            }
        },

        /**
         * Transition the dialog.
         *
         * @param {string} direction
         * @param {function} callback
         */
        transition: function(direction, callback) {
            var animation = this.config.transition + direction,
                settings  = {
                    duration: $.fn.transition.defaults.duration * 1.5,
                    onEnd: callback
                };

            if (this.config.openFrom) {
                animation = 'dialog' + direction;
                settings.curve = 'cubic-bezier(0.4,0.7,0.6,1)';
                settings.animations = this.getAnimation();
            }

            this.$elem.transition(animation, settings);
        },

        /**
         * Show or kill the window's scroll bar.
         *
         * @param {boolean} show
         */
        scrollBar: function(show) {
            if ($window.height() >= $document.height()) {
                return; // no scroll bar present
            }

            if (show) {
                $body.css({ // show
                    'overflow': '',
                    'padding-right': ''
                });
            } else {
                var $outer = $('<div/>').css({
                        width: 100,
                        overflow: 'scroll',
                        visibility: 'hidden'
                    }).appendTo($body),
                    $inner = $('<div/>').css({
                        width: '100%'
                    }).appendTo($outer);

                $body.css({ // kill
                    'overflow': 'hidden',
                    'padding-right': 100 - $inner.outerWidth() // scroll bar width
                });

                $outer.remove();
            }
        },

        /**
         * Focus the first form element in the dialog.
         */
        focus: function() {
            if (this.config.autoFocus) {
                this.$elem
                    .find('input, textarea, select')
                    .first()
                    .focus();
            }
        },

        /**
         * Custom (functional) animation to scale the dialog from
         * the target element to the center of the viewport - or
         * the other way around.
         *
         * @returns {Object}
         */
        getAnimation: function() {
            var windowTop = window.pageYOffset,
                $location = this.config.openFrom,
                locationOffset = $location.offset();

            var translation = {
                x : locationOffset.left - ($window.width() / 2) + ($location.width() / 2),
                y : locationOffset.top - windowTop - ($window.height() / 2) + ($location.height() / 2)
            };

            return {
                dialog: {
                    start: {
                        'opacity': 0,
                        'transform': 'translate(' + translation.x + 'px, ' + translation.y + 'px) scale(0.05)',
                        'transform-origin': 'center'
                    },
                    end: {
                        'opacity': 1,
                        'transform': 'translate(0,0) scale(1)'
                    }
                }
            }
        }

    });

    // Plugin

    $.fn[Name] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, Name);

            if ( ! data) {
                $.data(this, Name, new Dialog(this, settings));
            } else if (typeof settings === 'string' && data[settings]) {
                data[settings].apply(data, Array.isArray(args) ? args : [args]);
            }
        });
    };

    $.fn[Name].defaults = Defaults;


})(jQuery, window, document);
