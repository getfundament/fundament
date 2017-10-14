/*!
 * Fundament framework v0.3.5
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
 * Fundament core variables and utility functions.
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
    function generateId() {
        return (Math.random().toString(16) + '000000000').substr(2,8);
    }

    /**
     * Debounces a function which will be called after it stops being
     * called for x milliseconds. If 'immediate' is passed, trigger
     * the function on the leading edge, instead of the trailing.
     *
     * @param {function} func
     * @param {int} wait
     * @param {boolean} immediate
     */
    function debounce(func, wait, immediate) {
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
    }

    /**
     * Returns a prefixed CSS property.
     *
     * @param {string} attr
     * @returns {string}
     */
    function prefixProp(attr) {
        if (cssDeclaration[attr] === undefined) {
            for (var i = 0; i < cssPrefixes.length; i++) {
                var prefixed = cssPrefixes[i] + attr;
                if (cssDeclaration[prefixed] !== undefined) {
                    attr = prefixed;
                }
            }
        }

        return attr;
    }

    /**
     * Returns the supported transitionEnd event.
     *
     * @returns {string|null}
     */
    function transitionEnd() {
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
    }

    return {
        createID: generateId,
        debounce: debounce,
        prefixProp: prefixProp,
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

    // Globals
    var $window   = $(window),
        $document = $(document),
        $body     = $(document.body);

    var transitionEndEvent = Fm.transitionEnd();

    // Constructor
    function Dialog(element, settings) {
        this.config  = $.extend({}, $.fn[Name].defaults, settings);
        this.elem    = element;
        this.$elem   = $(element);
        this.$wrap   = $('<div/>', {class: ClassNames.wrap, role: 'document'});
        this.$dimmer = $('<div/>', {class: ClassNames.dimmer});
        this.busy    = false;
        this.init();
    }

    // Instance
    $.extend(Dialog.prototype, {

        init: function () {
            this.setup();
            this.bind();
        },

        /**
         * Create and retrieve DOM elements.
         */
        setup: function() {
            var conf = this.config;

            if ($(Selectors.dimmer).length === 0) {
                $body.append(this.$dimmer);
            }

            this.$dimmer = $(Selectors.dimmer);
            this.$wrap = this.$elem
                .wrap(this.$wrap) // wrap around dialog
                .parent() // retrieve element
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
                .on(transitionEndEvent, function(e) {
                    e.stopPropagation(); // prevent event bubbling
                });

            if (conf.closable) {
                self.$wrap.on('click', function(e) {
                    if (e.target === this) self.close();
                });
            }
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
                    .one(transitionEndEvent, function() {
                        self.scrollBar(true);
                        self.$dimmer.hide();
                        self.config.onClose.call(self.elem);
                        self.busy = false;
                    });
            });
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

    // Default settings
    $.fn[Name].defaults = Defaults;

})(jQuery, window, document);

/**
 * Dropdown plugin.
 *
 * @package Fundament
 */
;(function($, window) {
    'use strict';

    var Name = 'dropdown';

    var Defaults = {
        smart      : false,
        searchable : false,
        transition : 'display',
        onOpen     : function() {},
        onOpening  : function() {},
        onClose    : function() {},
        onClosing  : function() {},
        onSelect   : function(item) {}
    };

    var ClassNames = {
        dropdown : 'dropdown',
        select   : 'dropdown--select',
        reversed : 'dropdown--reversed',
        menu     : 'menu',
        item     : 'menu__item',
        open     : 'is-open',
        empty    : 'is-empty',
        active   : 'is-active'
    };

    var Selectors = {
        menu   : '.menu',
        item   : '.menu__item',
        active : '.is-active'
    };

    function Dropdown(element, settings) {
        this.config = $.extend({}, $.fn[Name].defaults, settings);
        this.elem   = element;
        this.$elem  = $(element);
        this.$menu  = this.$elem.find(Selectors.menu);
        this.$items = this.$elem.find(Selectors.item);
        this.init();
    }

    $.extend(Dropdown.prototype, {

        init: function() {
            this.setup();
            this.bind();

            if (this.is('select') && this.is('empty')) {
                this.$elem.addClass(ClassNames.empty);
            }
        },

        /**
         * Perform needed DOM operations.
         */
        setup: function() {
            this.$elem.attr('tabindex', 0);
            this.$items.attr('tabindex', -1);
        },

        /**
         * Bind event handlers.
         */
        bind: function() {
            this.$elem
                .on('mousedown', this.onMouseDown.bind(this))
                .on('keydown', this.onKeyDown.bind(this))
                .on('blur', this.close.bind(this));
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
                    return self.$elem.hasClass(ClassNames.open);
                },
                select: function() {
                    return self.$elem.hasClass(ClassNames.select);
                },
                empty: function() {
                    return self.$elem.find('input').val().length === 0
                }
            }[state].apply();
        },

        /**
         * Handle the mousedown event.
         *
         * @param {Event} e
         */
        onMouseDown: function(e) {
            if (e.target.nodeName === 'A') {
                return window.location.href = e.target.getAttribute('href'); // click on link
            }

            var $target = $(e.target);
            if ($target.hasClass(ClassNames.item)) {
                this.select($target); // click on item
            }

            this.toggle();
        },

        /**
         * Handle the keydown event.
         *
         * @param {Event} e
         */
        onKeyDown: function(e) {
            switch (e.which) {
                case 13 : // enter key
                case 32 : // space key
                    this.toggle();
                    e.preventDefault(); // prevent scroll
                    break;
                case 27 : // escape key
                    this.close();
                    break;
                case 38 : // arrow up
                    this.select('prev');
                    e.preventDefault(); // prevent scroll
                    break;
                case 40 : // arrow down
                    if ( ! this.is('select')) {
                        this.open();
                    }
                    this.select('next');
                    e.preventDefault(); // prevent scroll
                    break;
                default :
                    this.selectByKey(e.which);
            }
        },

        /**
         * Select a dropdown item.
         *
         * @param {jQuery|string} target
         */
        select: function(target) {
            var self = this,
                $active = self.$items.filter(Selectors.active),
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
                || $target.is($active)
            ) {
                return;
            }

            // TODO: scroll to item (overflowing content)

            // Set classes
            $active.removeClass(ClassNames.active);
            $target.addClass(ClassNames.active);
            self.$elem.removeClass(ClassNames.empty);

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
                var index = $matches.index($matches.filter(Selectors.active)),
                    $next = $($matches[index + 1]); // next match

                $next && $next.length ?
                    self.select($next):
                    self.select($matches.first());
            }
        },

        /**
         * Toggle the dropdown.
         *
         * @public
         */
        toggle: function() {
            this.is('open') ?
                this.close():
                this.open();
        },

        /**
         * Open the dropdown.
         *
         * @public
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
                self.$elem.toggleClass(ClassNames.reversed,
                    bottomSpace < menuHeight && topSpace > menuHeight
                );
            }

            self.$menu.transition(conf.transition + 'In', {
                queue: false,
                onEnd: conf.onOpen.bind(self.elem)
            });

            self.$elem.addClass(ClassNames.open);
        },

        /**
         * Close the dropdown.
         *
         * @public
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

            self.$elem.removeClass(ClassNames.open);
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
        }

    });

    /**
     * Transform a ordinary <select> into a dropdown.
     *
     * @param {HTMLElement} element
     */
    function transform(element) {
        if (element.nodeName !== 'SELECT') {
            return element;
        }

        var $select   = $(element),
            $options  = $select.find('option'),
            $selected = $options.filter(':selected');

        // Create elements
        var $dropdown = $('<div/>', {
                class: ClassNames.dropdown + ' ' + ClassNames.select,
                tabindex: 0
            }),
            $menu = $('<ul/>', {
                'class': ClassNames.menu,
                'role': 'listbox',
                'aria-hidden': true
            }),
            $input = $('<input/>', {
                type: 'hidden',
                name: $select.attr('name')
            }),
            $label = $('<span/>', {
                text: $selected.text()
            });

        // Create menu
        $options.each(function() {
            var $option = $(this),
                classes = ClassNames.item + ($option.is($selected) ? ' is-active' : '');

            if ($option.val() === '') {
                return;
            }

            $('<li/>', {
                'text': $option.text(),
                'class': classes,
                'role': 'option',
                'data-value': $option.val()
            }).appendTo($menu);
        });

        // Inherit selection
        $input.val($selected.val());

        // Generate HTML
        $dropdown = $select
            .wrap($dropdown)
            .after($menu, $label, $input)
            .parent(); // retrieve element

        $select.remove();

        return $dropdown[0];
    }

    // Plugin definition
    $.fn[Name] = function(settings, args) {
        return this.each(function() {
            var elem = transform(this),
                data = $.data(this, Name);

            if ( ! data) {
                $.data(elem, Name, new Dropdown(elem, settings));
            } else if (typeof settings === 'string' && data[settings]) {
                data[settings].apply(data, Array.isArray(args) ? args : [args]);
            }
        });
    };

    // Default settings
    $.fn[Name].defaults = Defaults;

})(jQuery, window);

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

            $.data(this.elem, Name, null);
        }

    });

    // Plugin definition
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

    // Default settings
    $.fn[Name].defaults = Defaults;

})(jQuery, window, document);

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

    // Instance
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

    // Plugin definition
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

    // Default settings
    $.fn[Name].defaults = Defaults;

})(jQuery, window, document);

/**
 * Tab plugin.
 *
 * @package Fundament
 */
;(function($, window) {
    'use strict';

    var Name = 'tab';

    var Defaults = {
        onOpen   : function() {},
        onSelect : function() {},
        onClose  : function() {}
    };

    var ClassNames = {
        item : 'menu__item',
        link : 'menu__link',
        tabs : 'menu--tabs'
    };

    // Constructor
    function Tab(element, settings) {
        this.config = $.extend({}, $.fn[Name].defaults, settings);
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
    $.fn[Name] = function(settings, args) {
        return this.each(function() {
            var data = $.data(this, Name);

            if ( ! data) {
                $.data(this, Name, new Tab(this, settings));
            } else if (typeof settings === 'string' && data[settings]) {
                data[settings].apply(data, Array.isArray(args) ? args : [args]);
            }
        });
    };

    // Default settings
    $.fn[Name].defaults = Defaults;

})(jQuery, window);

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
    var transitionEndEvent = Fm.transitionEnd();

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

            for (var prop in css) {
                var prefixed = Fm.prefixProp(prop); // prefix attributes
                if (prefixed !== prop)
                    css[prefixed] = css[prop];
            }

            return css;
        }
    });

    // Plugin definition
    $.fn[Name] = function(animation, settings, onEnd) {
        return this.each(function() {
            new Transition(this, animation, settings, onEnd);
        });
    };

    // Default settings
    $.fn[Name].defaults = Defaults;
    $.fn[Name].defaults.animations = {
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
