/**
 * Dialog plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var plugin  = 'dialog',
        methods = ['toggle', 'open', 'close', 'setting'];

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

            if (conf.closable) {
                self.$dimmer.click(function(e) {
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
            self.scrollBar(false);

            self.transition('In', function() { // show
                self.$elem.addClass(conf.classNames.open);
                self.busy = false;
                conf.onOpen.call(self.elem);
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

            self.transition('Out', function() { // hide
                self.$elem.removeClass(conf.classNames.open);
                self.scrollBar(true);
                self.busy = false;
                conf.onClose.call(self.elem);
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
                duration = 400,
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
                    'opacity': 0,
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
        transition : 'fadeDown',
        classNames : {
            dimmer : 'dialog-dimmer',
            open   : 'dialog--open'
        },
        onOpen    : function() {},
        onOpening : function() {},
        onClose   : function() {},
        onClosing : function() {}
    };
})(jQuery, window, document);
