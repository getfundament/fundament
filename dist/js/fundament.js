/*!
 * Fundament framework v0.3.1
 *
 * https://getfundament.com
 *
 * @license MIT
 * @author Jason Koolman and The Fundament Authors
 */

// Normalization
window.requestAnimationFrame = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.msRequestAnimationFrame
    || window.oRequestAnimationFrame
    || function(callback){ setTimeout(callback, 0) };

/**
 * Fundament global variables and utility functions.
 *
 * @package Fundament
 */
var Fm = (function(document) {

    var cssPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'],
        cssDeclaration = document.createElement('div').style;

    /**
     * Generate a fairly random unique identifier.
     *
     * @returns {string}
     */
    var createID = function() {
        return (Math.random().toString(16) + '000000000').substr(2,8);
    };

    /**
     * Debounces a function which will be called after it stops being
     * called for x milliseconds. If 'immediate' is passed, trigger
     * the function on the leading edge, instead of the trailing.
     *
     * @param {function} func
     * @param {int} wait
     * @param {boolean} immediate
     */
    var debounce = function(func, wait, immediate) {
        var timeout;

        return function() {
            var self    = this,
                args    = arguments,
                callNow = immediate && !timeout;

            var later = function() {
                timeout = null;

                if ( ! immediate)
                    func.apply(self, args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow)
                func.apply(self, args);
        };
    };

    /**
     * Returns a prefixed CSS attribute.
     *
     * @param {string} attr
     * @returns {string}
     */
    var prefixAttr = function(attr) {
        if (cssDeclaration[attr] === undefined) {
            for (var i = 0; i < cssPrefixes.length; i++) {
                var prefixed = cssPrefixes[i] + attr;
                if (cssDeclaration[prefixed] !== undefined) {
                    attr = prefixed;
                }
            }
        }

        return attr;
    };

    /**
     * Returns the supported transitionEnd event.
     *
     * @returns {string|null}
     */
    var transitionEnd = function() {
        var events = {
            transition       : 'transitionend',
            OTransition      : 'otransitionend',
            MozTransition    : 'transitionend',
            WebkitTransition : 'webkitTransitionEnd'
        };

        for (var event in events) {
            if (cssDeclaration[event] !== undefined) {
                return events[event];
            }
        }

        return null;
    };

    return {
        createID: createID,
        debounce: debounce,
        prefixAttr: prefixAttr,
        transitionEnd: transitionEnd
    };

})(document);

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
                self.$dimmer.on('click', function(e) {
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
        },

        /**
         * Close the dialog.
         */
        close: function () {
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
        },

        /**
         * Transition the dialog.
         *
         * @param {string} direction
         * @param {function} callback
         */
        transition: function(direction, callback) {
            var self      = this,
                conf      = self.config,
                animation = conf.transition + direction,
                settings  = {};

            settings.duration = $.fn.transition.defaults.duration * 1.5;
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
         * Override the instance's settings.
         *
         * @param {Object} settings
         */
        setting: function(settings) {
            $.extend(this.config, settings);
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

/**
 * Dropdown plugin.
 *
 * @package Fundament
 */
;(function($, window) {
    'use strict';

    var plugin    = 'dropdown',
        methods   = ['toggle', 'open', 'close', 'setting'];

    // Constructor
    function Dropdown(element, settings) {
        this.config = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem   = element;
        this.$elem  = $(element);
        this.$menu  = this.$elem.find('.' + this.config.classNames.menu);
        this.$items = this.$elem.find('.' + this.config.classNames.item);
        this.init();
    }

    // Instance
    $.extend(Dropdown.prototype, {

        init: function() {
            this.bind();

            if (this.is('select') && this.is('empty')) {
                this.$elem.addClass(this.config.classNames.empty);
            }
        },

        /**
         * Bind event handlers.
         */
        bind: function() {
            var self = this;

            self.$elem
                .on('mousedown', function(e) {
                    var $target = $(e.target);
                    if ($target.hasClass(self.config.classNames.item)) {
                        self.select($target); // click on item
                    }
                    self.toggle();
                })
                .on('focusout', self.close.bind(self))
                .on('keydown', function(e) {
                    switch (e.which) {
                        case 32 : // space key
                        case 13 : // enter key
                            self.toggle();
                            e.preventDefault(); // prevent scroll
                            break;
                        case 38 : // arrow up
                            self.select('prev');
                            e.preventDefault(); // prevent scroll
                            break;
                        case 40 : // arrow down
                            self.select('next');
                            e.preventDefault(); // prevent scroll
                            break;
                        default :
                            self.selectByKey(e.which);
                    }
                });
        },

        /**
         * Check the state of the dropdown.
         *
         * @param {string} state
         */
        is: function(state) {
            var self = this;

            return {
                open: function() {
                    return self.$elem.hasClass(self.config.classNames.open);
                },
                select: function() {
                    return self.$elem.hasClass(self.config.classNames.select);
                },
                empty: function() {
                    return self.$elem.find('input').val().length === 0
                }
            }[state].apply();
        },

        /**
         * Select a dropdown item.
         *
         * @param {jQuery|string} target
         */
        select: function(target) {
            var self = this,
                $active = self.$items.filter('.active'),
                $target;

            // Retrieve target item
            if (target instanceof jQuery) {
                $target = target; // element is passed
            } else {
                if ($active.length) {
                    $target = (target === 'next') ?
                        $active.next():
                        $active.prev();
                } else {
                    $target = self.$items.first();
                }
            }

            if ( ! $target
                || $target.length === 0
                || $target.is($active)) {
                return false;
            }

            // TODO: scroll to item (overflowing content)

            // Set classes
            $active.removeClass('active');
            $target.addClass('active');
            self.$elem.removeClass(self.config.classNames.empty);

            if (self.is('select')) {
                self.$elem // input value
                    .find('> input')
                    .val( $target.data('value') );

                self.$elem // label value
                    .find('> span')
                    .text( $target.text() );
            }

            self.config.onSelect.call(self.elem, $target[0]);
        },

        /**
         * Select an item by pressing it's first character.
         *
         * @param {int} keyCode
         */
        selectByKey: function(keyCode) {
            var self = this,
                char = String.fromCharCode(keyCode).toLowerCase();

            if ( ! char) {
                return;
            }

            var $matches = self.$items.filter(function() {
                return $(this).text().substr(0,1).toLowerCase() === char
            });

            if ($matches.length) {
                var index = $matches.index($matches.filter('.active')),
                    $next = $($matches[index + 1]); // next match

                $next && $next.length ?
                    self.select($next):
                    self.select($matches.first());
            }
        },

        /**
         * Toggle the dropdown.
         */
        toggle: function() {
            this.is('open') ?
                this.close():
                this.open();
        },

        /**
         * Open the dropdown.
         */
        open: function() {
            var self = this,
                conf = self.config;

            if (self.is('open')) {
                return;
            }

            conf.onOpening.call(self.elem);

            if (conf.smart) {
                var menuHeight  = self.$menu.outerHeight(),
                    topSpace    = self.$elem.offset().top - window.pageYOffset,
                    bottomSpace = window.innerHeight - topSpace - self.$elem.outerHeight();

                // Find the best direction for the menu to open
                self.$elem.toggleClass(conf.classNames.reversed,
                    bottomSpace < menuHeight && topSpace > menuHeight
                );
            }

            self.$menu.transition(conf.transition + 'In', {
                queue: false,
                onEnd: conf.onOpen.bind(self.elem)
            });

            self.$elem.addClass(conf.classNames.open);
        },

        /**
         * Close the dropdown.
         */
        close: function() {
            var self = this,
                conf = self.config;

            if ( ! self.is('open')) {
                return;
            }

            conf.onClosing.call(self.elem);

            self.$menu.transition(conf.transition + 'Out', {
                queue: false,
                onEnd: conf.onClose.bind(self.elem)
            });

            self.$elem.removeClass(conf.classNames.open);
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

    /**
     * Transform a ordinary <select> into a dropdown.
     *
     * @param {HTMLElement} element
     */
    function transform(element) {
        var $select = $(element);

        if ( ! $select.is('select')) {
            return element;
        }

        var identifier = Fm.createID(),
            classNames = $.fn[plugin].defaults.classNames,
            $options   = $select.find('option'),
            $selected  = $options.filter(':selected');

        // Create elements
        var $dropdown = $('<div/>', {
                id: identifier,
                class: classNames.dropdown + ' ' + classNames.select,
                tabindex: 0
            }),
            $menu  = $('<ul/>', {
                'class': classNames.menu,
                'aria-hidden': true,
                'aria-labelledby': identifier
            }),
            $label = $('<span/>'),
            $input = $('<input/>', {
                type: 'hidden',
                name: $select.attr('name')
            });

        // Create menu
        $options.each(function() {
            var $option = $(this);
            if ($option.val()) {
                $('<li/>', {
                    'text': $option.text(),
                    'class': 'menu__item',
                    'data-value': $option.val()
                }).appendTo($menu);
            } else {
                $label.text( $option.text() );
            }
        });

        // Inherit selection
        if ($selected.val()) {
            $input.val( $selected.val() );
            $label.text( $selected.text() );
        }

        // Generate HTML
        $select
            .wrap($dropdown)
            .after($menu, $label, $input);

        $dropdown = $select.parents('.' + classNames.dropdown);

        $select.remove();

        return $dropdown[0];
    }

    // Plugin definition
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var elem = transform(this),
                data = $.data(this, plugin);

            if ( ! data) {
                $.data(elem, plugin, new Dropdown(elem, settings));
            } else if (typeof settings === 'string') {
                methods.indexOf(settings) > -1 ?
                    data[settings].apply(data, $.isArray(args) ? args : [args]):
                    console.warn(plugin + ': Trying to call a inaccessible method');
            }
        });
    };

    // Default settings
    $.fn[plugin].defaults = {
        smart      : false,
        searchable : false,
        transition : 'display',
        classNames : {
            dropdown : 'dropdown',
            select   : 'dropdown--select',
            open     : 'dropdown--open',
            empty    : 'dropdown--empty',
            reversed : 'dropdown--reversed',
            menu     : 'menu',
            item     : 'menu__item'
        },
        onOpen    : function() {},
        onOpening : function() {},
        onClose   : function() {},
        onClosing : function() {},
        onSelect  : function(item) {}
    };

})(jQuery, window);

/**
 * Popup plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var plugin    = 'popup',
        namespace = '.' + plugin,
        methods   = ['toggle', 'show', 'hide', 'setting', 'destroy'];

    var $window = $(window),
        $body   = $(document.body);

    // Constructor
    function Popup(element, settings) {
        this.namespace = namespace + '.' + Fm.createID();
        this.config    = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem      = element;
        this.$elem     = $(element);
        this.$popup    = this.$elem.next('.' + this.config.classNames.popup);
        this.calc      = null;
        this.timer     = null;
        this.active    = false;
        this.init();
    }

    // Instance
    $.extend(Popup.prototype, {

        init: function() {
            var self = this;

            if ( ! self.$popup.length) {
                self.create();
            } else {
                // make sure the popup is a direct child
                // of the body for absolute positioning
                self.$popup
                    .detach()
                    .appendTo($body);
            }

            self.bind();
        },

        /**
         * Create and append a new popup element.
         */
        create: function() {
            var $popup = $('<div/>', {
                    class : this.config.classNames.popup,
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
                .addClass(self.config.classNames.popup + '--' + direction);
        },

        /**
         * Toggle the popup.
         */
        toggle: function() {
            this.active ?
                this.hide():
                this.show();
        },

        /**
         * Show the popup.
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
         * @param {Object} settings
         */
        setting: function(settings) {
            $.extend(this.config, settings);
        },

        /**
         * Destroy the instance.
         */
        destroy: function() {
            this.unbind();
            this.$popup.remove();

            $.data(this.elem, plugin, null);
        }

    });

    // Plugin definition
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, plugin);

            if ( ! data) {
                $.data(this, plugin, new Popup(this, settings));
            } else if (typeof settings === 'string') {
                methods.indexOf(settings) > -1 ?
                    data[settings].apply(data, $.isArray(args) ? args : [args]):
                    console.warn(plugin + ': Trying to call a inaccessible method');
            }
        });
    };

    // Default settings
    $.fn[plugin].defaults = {
        trigger    : 'hover',
        transition : 'display',
        direction  : 'southwest',
        delay      : 100,
        distance   : 10,
        hoverable  : false,
        classNames : {
            popup  : 'popup'
        },
        onShow : function() {},
        onHide : function() {}
    };

})(jQuery, window, document);

/**
 * Sticky plugin.
 *
 * @package Fundament
 */
;(function($, window, document) {
    'use strict';

    var plugin    = 'sticky',
        methods   = ['calculate', 'setting', 'destroy'],
        namespace = '.' + plugin;

    var $window = $(window),
        windowHeight = $window.height();

    // Constructor
    function Sticky(element, settings) {
        this.namespace = namespace + '.' + Fm.createID();
        this.config    = $.extend({}, $.fn[plugin].defaults, settings);
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

    // Instance
    $.extend(Sticky.prototype, {

        init: function() {
            if ( ! this.$context.length) {
                return console.warn(plugin + ': Undefined context element');
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
                console.warn(plugin + ': Insufficient scrolling space available');
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
                    self.$elem.addClass(self.config.classNames.stick);
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
                $mask = this.$elem.next('.' + this.config.classNames.mask);

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
                            class : self.config.classNames.mask,
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
                    this.config.classNames.stick + ' ' +
                    this.config.classNames.bound
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

            $.data(this.elem, plugin, null); // unset data
        }

    });

    // Plugin definition
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, plugin);

            if ( ! data) {
                $.data(this, plugin, new Sticky(this, settings));
            } else if (typeof settings === 'string') {
                methods.indexOf(settings) > -1 ?
                    data[settings].apply(data, $.isArray(args) ? args : [args]):
                    console.warn(plugin + ': Trying to call a inaccessible method');
            }
        });
    };

    // Default settings
    $.fn[plugin].defaults = {
        context      : null,
        mask         : true,
        observe      : false,
        topOffset    : 0,
        bottomOffset : 0,
        scrollSpace  : 200,
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

/**
 * Tab plugin.
 *
 * @package Fundament
 */
;(function($, window) {
    'use strict';

    var plugin   = 'tab',
        methods  = [];

    // Constructor
    function Tab(element, settings) {
        this.config = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem   = element;
        this.$elem  = $(element);
        this.init();
    }

    // Instance
    $.extend(Tab.prototype, {

        init: function() {

        }

    });

    // Plugin definition
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, plugin);

            if ( ! data) {
                $.data(this, plugin, new Tab(this, settings));
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
        classNames : {
            tabs   : 'menu--tabs',
            item   : 'menu__item',
            link   : 'menu__link'
        },
        onOpen   : function() {},
        onSelect : function() {},
        onClose  : function() {}
    };

})(jQuery, window);

/**
 * Transition plugin.
 *
 * @package Fundament
 */
;(function($) {
    'use strict';

    var plugin = 'transition';

    var transitionEndEvent = Fm.transitionEnd();

    // Constructor
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

            if (self.animation === 'display') {
                return self.end();
            } else if ( ! config.animations.hasOwnProperty(self.animation)) {
                return console.warn('Trying to call an undefined animation');
            }

            if (transitionEndEvent) {
                self.$elem
                    .off(transitionEndEvent) // prevent any interruptions
                    .one(transitionEndEvent, function(e) {
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
        duration : 280,
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
            start : { 'opacity': 0.2, 'transform': 'scaleY(0.01)', 'transform-origin': 'bottom'},
            end   : { 'opacity': 1, 'transform': 'scaleY(1)', 'transform-origin': 'bottom'}
        },
        slideDown: {
            start : { 'opacity': 0.2, 'transform': 'scaleY(0.01)', 'transform-origin': 'top'},
            end   : { 'opacity': 1, 'transform': 'scaleY(1)', 'transform-origin': 'top'}
        },

        // flip
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

//# sourceMappingURL=fundament.js.map
