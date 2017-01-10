/**
 * Dialog plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var plugin    = 'dialog',
        namespace = '.' + plugin,
        methods   = ['open', 'close'];

    var $window   = $(window),
        $document = $(document),
        $body     = $('body');

    // Constructor
    function Dialog(element, settings) {
        this.config = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem  = element;
        this.$elem = $(element);
        this.init();
    }

    // Instance
    $.extend(Dialog.prototype, {

        init: function () {
            var self     = this,
                settings = self.config,
                $trigger = settings.openFrom,
                $dimmer  = $('<div/>', {class: this.config.classNames.dimmer});

            this.dialogSize = {
                width  : self.$elem.outerWidth(),
                height : self.$elem.outerHeight()
            };

            // Set trigger
            if ($trigger && $trigger instanceof jQuery === false) {
                settings.openFrom = $($trigger);
            }

            // Bind event handlers
            if (settings.closable) {
                $dimmer.click(function(e) {
                    if (e.target.className === settings.classNames.dimmer) {
                        self.close();
                    }
                });
            }

            // Wrap dimmer
            self.$elem.wrap( $dimmer.hide() );
        },

        /**
         * Open the dialog.
         */
        open: function () {
            var self     = this,
                settings = self.config,
                $dimmer  = self.$elem.parents('.' + self.config.classNames.dimmer);

            var onOpen = function() {
                self.$elem.css({position: '', top: '', left: ''}).addClass(settings.classNames.open);
                settings.onOpen.call(self.elem);
            };

            // document.documentElement.style.overflow = 'hidden';  // firefox, chrome
            // document.body.scroll = "no"; // ie only
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';

            $dimmer.transition('fade');

            if (settings.openFrom) {
                self.$elem.transition('dialogIn', {
                    duration: 400,
                    curve: 'cubic-bezier(0.4,0.6,0.3,1)',
                    animations: self.getAnimation(),
                    onEnd: onOpen
                });
            } else {
                self.$elem.transition(settings.transition + 'In', onOpen);
            }
        },

        /**
         * Close the dialog.
         */
        close: function () {
            var self     = this,
                settings = self.config,
                $dimmer  = self.$elem.parents('.' + settings.classNames.dimmer);

            document.documentElement.style.overflow = 'auto';  // firefox, chrome
            document.body.scroll = "yes"; // ie only

            $dimmer.transition('fadeOut');

            if (settings.openFrom) {
                var transition = 'scaleOut';
            } else {
                var transition = settings.transition + 'Out';
            }

            self.$elem.transition(transition, function() {
                self.$elem.removeAttr('style').removeClass(settings.classNames.open);
                settings.onClose.call(self.elem);
            });
        },

        getAnimation: function() {
            var self     = this,
                $trigger = self.config.openFrom;

            var windowTop     = window.pageYOffset,
                triggerSize   = {width: $trigger.outerWidth(), height: $trigger.outerHeight()},
                triggerOffset = $trigger.offset();

            // Scale dialog to trigger size
            var scaleFactor = {
                width  : triggerSize.width / self.dialogSize.width,
                height : triggerSize.height / self.dialogSize.height
            };

            // Transform to center
            var coords = {
                start: {
                    x : triggerOffset.left,
                    y : triggerOffset.top - windowTop
                },
                end: {
                    x : ($window.width() / 2) - (self.dialogSize.width / 2),
                    y : ($window.height() / 2) - (self.dialogSize.height / 2)
                }
            };
            var translation = {
                x : coords.end.x - coords.start.x,
                y : coords.end.y - coords.start.y
            };

            return {
                dialog: {
                    start: {
                        'position'         : 'absolute',
                        'top'              : triggerOffset.top - windowTop,
                        'left'             : triggerOffset.left,
                        'opacity'          : 0.5,
                        'transform'        : 'scale(' + scaleFactor.width + ', ' + scaleFactor.height + ')',
                        'transform-origin' : 'top left'
                    },
                    end: {
                        'opacity'   : 1,
                        'transform' : 'translate(' + translation.x + 'px, ' + translation.y + 'px) scale(1)'
                    }
                }
            }
        }
    });

    // Plugin definition
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, plugin);

            if ( ! data) {
                $.data(this, plugin, new Dialog(this, settings));
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
        openFrom   : null,
        closable   : true,
        transition : 'scale',
        classNames : {
            dimmer  : 'dialog-dimmer',
            dialog  : 'dialog',
            open    : 'dialog--open',
            block   : 'dialog__block'
        },
        onOpen    : function() {},
        onOpening : function() {},
        onClose   : function() {},
        onClosing : function() {}
    };
})(jQuery, window, document);
