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

    function Dropdown(element, settings) {
        this.config = $.extend({}, $.fn[Name].defaults, settings);
        this.elem   = element;
        this.$elem  = $(element);
        this.$menu  = this.$elem.find('.' + ClassNames.menu);
        this.$items = this.$elem.find('.' + ClassNames.item);
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
                $active = self.$items.filter('.' + ClassNames.active),
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
                var index = $matches.index($matches.filter('.' + ClassNames.active)),
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
