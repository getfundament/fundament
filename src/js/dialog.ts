import Plugin from './plugin';
import Core from './core';
import DialogConfig from './interfaces/config.dialog.interface';

export default (($, window, document) => {

    /** Constants */
    const plugin  = 'dialog',
          methods = ['toggle', 'open', 'close', 'setting'];

    const $window   = $(window),
          $document = $(document),
          $body     = $(document.body);

    const transitionEndEvent = Core.transitionEnd();

    /** Class definition */
    class Dialog extends Plugin {

        /* The name of the plugin */
        public name = plugin;

        /* The public methods of the plugin */
        public methods = methods;

        /* The plugin configuration */
        public config: DialogConfig;

        /* The dimmer element */
        public $dimmer: JQuery;

        /* Whether the dialog is busy transitioning */
        public busy: boolean;

        /**
         * @constructor
         *
         * @param {HTMLElement} element
         * @param {DialogConfig} config
         */
        constructor(element: HTMLElement, config: DialogConfig) {
            super(plugin, element, config);
            this.$dimmer = $('<div/>');//, {class: this.config.classNames.dimmer});
            this.busy    = false;
            console.log('Dialog', this);
            this.init();
        }

        init () {
            this.$dimmer = this.$elem
                .wrap(this.$dimmer) // wrap around dialog
                .parent() // retrieve dimmer element
                .hide();

            this.bind();
        }

        /**
         * Bind event handlers.
         */
        bind () {
            var self = this,
                conf = self.config;

            self.$elem
                .on('click', '.' + conf.classNames.close, self.close.bind(self))
                .find('.' + conf.classNames.block)
                .on(transitionEndEvent, function(e) {
                    e.stopPropagation(); // prevent event bubbling
                });

            if (conf.closable) {
                self.$dimmer.on('click', function(e) {
                    if (e.target === this) self.close();
                });
            }

            if (conf.openFrom) {
                conf.openFrom = $(conf.openFrom);
            }
        }

        /**
         * Toggle the dialog.
         */
        toggle () {
            this.$elem.is(':visible') ?
                this.close():
                this.open();
        }

        /**
         * Open the dialog.
         */
        open () {
            var self = this;

            if (self.busy) {
                return;
            }

            self.$dimmer.show().addClass('active');
            self.scrollBar(false);
            self.config.onOpening.call(self.elem);

            self.transition('In', function() { // show
                self.focus();
            });
        }

        /**
         * Close the dialog.
         */
        close() {
            var self = this;

            if (self.busy) {
                return;
            }

            self.$dimmer.removeClass('active');
            self.config.onClosing.call(self.elem);

            self.transition('Out', function() { // hide
                self.$dimmer.hide();
                self.scrollBar(true);
            });
        }

        /**
         * Transition the dialog.
         *
         * @param {string} direction
         * @param {function} callback
         */
        transition(direction, callback) {
            var self      = this,
                conf      = self.config,
                animation = conf.transition + direction,
                settings: any = {};

            settings.duration = 420;
            settings.onEnd = function() {
                callback();
                self.busy = false;
                self.$elem.toggleClass(self.config.classNames.open, direction === 'In');
                direction === 'In' ? conf.onOpen.call(self.elem) : conf.onClose.call(self.elem);
            };

            if (this.config.openFrom) {
                animation = 'dialog' + direction;
                settings.curve = 'cubic-bezier(0.4,0.7,0.6,1)';
                settings.animations = this.getAnimation();
            }

            this.busy = true;
            //this.$elem.transition(animation, settings);
        }

        /**
         * Show or kill the window's scroll bar.
         *
         * @param {boolean} show
         */
        scrollBar(show) {
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
        }

        /**
         * Focus the first form element in the dialog.
         */
        focus() {
            if (this.config.autoFocus) {
                this.$elem
                    .find('input, textarea, select')
                    .first()
                    .focus();
            }
        }

        /**
         * Override the instance's settings.
         *
         * @param {Object} settings
         */
        setting(settings) {
            $.extend(this.config, settings);
        }

        /**
         * Custom (functional) animation to scale the dialog from
         * the target element to the center of the viewport - or
         * the other way around.
         *
         * @returns {Object}
         */
        getAnimation() {
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
    }

    /** jQuery implementation */
    $.fn[plugin] = function(settings, args) {
        return (<JQuery>this).each(function() {
            const data = $.data(this, plugin);

            if ( ! data) {
                $.data(this, plugin, new Dialog(this, settings));
            } else if (typeof settings === 'string') {
                methods.indexOf(settings) > -1 ?
                    data[settings].apply(data, Array.isArray(args) ? args : [args]):
                    console.warn(plugin + ': Trying to call a inaccessible method');
            }
        });
    };

    $.fn[plugin].defaults = {
        openFrom: null,
        closable: true,
        autoFocus: true,
        transition: 'display',
        onOpening: () => {},
        onOpen: () => {},
        onClosing: () => {},
        onClose: () => {},
    };

    return Dialog;

})(jQuery, window, document);
