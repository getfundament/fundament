/**
 * Dropdown plugin.
 *
 * @package Fundament
 */
;(function($, window) {
    'use strict';

    var plugin    = 'dropdown',
        methods   = ['toggle', 'open', 'close', 'setting'];

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

    // Constructor
    function Dropdown(element, settings) {
        this.config = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem   = element;
        this.$elem  = $(element);
        this.$menu  = this.$elem.find('.' + ClassNames.menu);
        this.$items = this.$elem.find('.' + ClassNames.item);
        this.init();
    }

    // Instance
    $.extend(Dropdown.prototype, {

        init: function() {
            this.bind();

            if (this.is('select') && this.is('empty')) {
                this.$elem.addClass(ClassNames.empty);
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
                    if ($target.hasClass(ClassNames.item)) {
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
                || $target.is($active)) {
                return false;
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
    $.fn[plugin] = function(settings, args) {
        return this.each(function() {
            var elem = transform(this),
                data = $.data(this, plugin);

            if ( ! data) {
                $.data(elem, plugin, new Dropdown(elem, settings));
            } else if (typeof settings === 'string') {
                methods.indexOf(settings) > -1 ?
                    data[settings].apply(data, Array.isArray(args) ? args : [args]):
                    console.warn(plugin + ': Trying to call a inaccessible method');
            }
        });
    };

    // Default settings
    $.fn[plugin].defaults = Defaults;

})(jQuery, window);
