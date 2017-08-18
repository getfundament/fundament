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
