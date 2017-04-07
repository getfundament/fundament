/**
 * Dialog plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var plugin  = 'dialog',
        methods = ['toggle', 'open', 'close', 'setting'];

    var transitionEndEvent = Fm.transitionEnd();

    var $window   = $(window),
        $document = $(document),
        $body     = $(document.body);

    // Constructor
    function Dialog(element, settings) {
        this.config  = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem    = element;
        this.$elem   = $(element);
        this.$dimmer = $('<div/>', {class: this.config.classNames.dimmer});
        this.busy    = false;
        this.init();
    }

    // Instance
    $.extend(Dialog.prototype, {

        init: function () {
            this.$dimmer = this.$elem
                .wrap(this.$dimmer) // wrap around dialog
                .parent() // retrieve dimmer element
                .hide();

            this.bind();
        },

        /**
         * Bind event handlers.
         */
        bind: function() {
            var self = this,
                conf = self.config;

            self.$elem
                .on('click', '.' + conf.classNames.close, self.close.bind(self))
                .find('.' + conf.classNames.block)
                .on(transitionEndEvent, function(e) {
                    e.stopPropagation(); // prevent event bubbling
                });

            if (conf.closable) {
                self.$dimmer
                    .on('click', function(e) {
                        if (e.target === this) self.close();
                    });
            }

            if (conf.openFrom) {
                conf.openFrom = $(conf.openFrom);
            }
        },

        /**
         * Toggle the dialog.
         */
        toggle: function () {
            this.$elem.is(':visible') ?
                this.close():
                this.open();
        },

        /**
         * Open the dialog.
         */
        open: function () {
            var self = this,
                conf = self.config;

            if (self.busy) {
                return;
            }

            self.busy = true;
            conf.onOpening.call(self.elem);
            self.scrollBar(false);

            self.transition('In', function() { // show
                self.$elem.addClass(conf.classNames.open);
                self.focus();
                conf.onOpen.call(self.elem);
                self.busy = false;
            });
        },

        /**
         * Close the dialog.
         */
        close: function () {
            var self = this,
                conf = self.config;

            if (self.busy) {
                return;
            }

            self.busy = true;
            conf.onClosing.call(self.elem);

            self.transition('Out', function() { // hide
                self.$elem.removeClass(conf.classNames.open);
                self.scrollBar(true);
                conf.onClose.call(self.elem);
                self.busy = false;
            });
        },

        /**
         * Transition the dialog.
         *
         * @param {string} direction
         * @param {function} callback
         */
        transition: function(direction, callback) {
            var animation,
                duration = $.fn.transition.defaults.duration * 1.5,
                settings = {
                    duration: duration,
                    onEnd: callback
                };

            if (this.config.openFrom) {
                animation = 'dialog' + direction;
                settings.curve = 'cubic-bezier(0.4,0.7,0.6,1)';
                settings.animations = {
                    dialog: this.getAnimation()
                };
            } else {
                animation = this.config.transition + direction;
            }

            this.$dimmer.transition('fade' + direction, duration);
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
            var self = this,
                windowTop = window.pageYOffset,
                $location = self.config.openFrom,
                locationOffset = $location.offset();

            var translation = {
                x : locationOffset.left - ($window.width() / 2) + ($location.width() / 2),
                y : locationOffset.top - windowTop - ($window.height() / 2) + ($location.height() / 2)
            };

            return {
                start: {
                    'opacity': 0.2,
                    'transform': 'translate(' + translation.x + 'px, ' + translation.y + 'px) scale(0.05)',
                    'transform-origin': 'center'
                },
                end: {
                    'opacity': 1,
                    'transform': 'translate(0,0) scale(1)'
                }
            }
        },

        /**
         * Override the instance's settings.
         *
         * @param {Object} settings
         */
        setting: function(settings) {
            $.extend(this.config, settings);
        }

    });

    // Plugin definition
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, plugin);

            if ( ! data) {
                $.data(this, plugin, new Dialog(this, settings));
            } else if (typeof settings === 'string') {
                methods.indexOf(settings) > -1 ?
                    data[settings].apply(data, $.isArray(args) ? args : [args]):
                    console.warn(plugin + ': Trying to call a inaccessible method');
            }
        });
    };

    // Default settings
    $.fn[plugin].defaults = {
        openFrom   : null,
        closable   : true,
        autoFocus  : true,
        transition : 'scale',
        classNames : {
            dimmer : 'dialog-dimmer',
            open   : 'dialog--open',
            block  : 'dialog__block',
            close  : 'dialog__close'
        },
        onOpen    : function() {},
        onOpening : function() {},
        onClose   : function() {},
        onClosing : function() {}
    };
})(jQuery, window, document);
