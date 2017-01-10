/**
 * Dropdown plugin.
 *
 * @package Fundament
 */
;(function($, window) {
    'use strict';

    var plugin    = 'dropdown',
        methods   = ['open', 'close', 'toggle', 'setting'];

    // Constructor
    function Dropdown(element, settings) {
        this.config    = $.extend({}, $.fn[plugin].defaults, settings);
        this.elem      = element;
        this.$elem     = $(element);
        this.$menu     = this.$elem.find('.' + this.config.classNames.menu);
        this.$items    = this.$elem.find('.' + this.config.classNames.item);
        this.init();
    }

    // Instance
    $.extend(Dropdown.prototype, {

        init: function() {
            var self = this;

            if (self.is('select') && self.is('empty')) {
                self.$elem.addClass(self.config.classNames.empty);
            }

            // Bind handlers
            self.$elem
                .mousedown(function(e) {
                    var $target = $(e.target);
                    if ($target.hasClass(self.config.classNames.item)) {
                        self.select($target); // click on item
                    }
                    self.toggle();
                })
                .keydown(function(e) {
                    switch (e.which) {
                        case 13 : // enter key
                            self.toggle();
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
                })
                .focusout(function() {
                    self.close();
                });
        },

        /**
         * Override the instance's settings.
         *
         * @param settings
         */
        setting: function(settings) {
            for (var setting in settings) {
                this.config[setting] = settings[setting];
            }
        },

        /**
         * Check the state of the dropdown.
         *
         * @param state
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
         * @param target
         */
        select: function(target) {
            var self      = this,
                $selected = self.$items.filter('.active'),
                $item;

            if (target instanceof jQuery) {
                $item = target; // element is passed
            } else {
                if ($selected.length > 0) {
                    $item = (target === 'next') ?
                        $selected.next():
                        $selected.prev();
                } else {
                    $item = self.$items.first();
                }
            }

            // Avoid unnecessary DOM manipulations
            if ( ! $item || $item.length === 0 || $item.is($selected)) {
                return false;
            }

            // TODO: scroll to item
            //self.$menu.scrollTop($item.offset().top  - self.$menu.offset().top);

            // Set classes
            self.$elem.removeClass(self.config.classNames.empty);
            $selected.removeClass('active');
            $item.addClass('active');

            if (self.is('select')) {
                // Set label and input value
                self.$elem.find('input').val( $item.data('value') );
                self.$elem.find('span').first().text( $item.text() );
            }

            self.config.onSelect.call(self.elem);
        },

        /**
         * Select an item by pressing it's first character.
         *
         * @param keyCode
         */
        selectByKey: function(keyCode) {
            var self = this,
                char = String.fromCharCode(keyCode).toLowerCase();

            if ( ! char) return;

            var $matches = self.$items.filter(function() {
                return $(this).text().substr(0, 1).toLowerCase() === char
            });

            if ($matches.length) {
                var $next = $matches.eq(
                    $matches.filter('.active').index() + 1 // next match within collection
                );

                $next.length ?
                    self.select($next):
                    self.select($matches.first());
            }
        },

        /**
         * Toggles the dropdown.
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
            var self  = this;

            if (self.is('open')) {
                return;
            }
            else if (self.config.smart && self.is('select')) {
                var menuHeight  = self.$menu.outerHeight(),
                    topSpace    = self.$elem.offset().top - window.pageYOffset,
                    bottomSpace = window.innerHeight - topSpace - self.$elem.outerHeight();

                // Find the best direction for the menu to open
                (bottomSpace < menuHeight && topSpace > menuHeight) ?
                    self.$elem.addClass(self.config.classNames.reversed):
                    self.$elem.removeClass(self.config.classNames.reversed);
            }

            self.$menu.transition(self.config.transition + 'In', {
                queue: false,
                onEnd: self.config.onOpen.bind(self.elem)
            });

            self.$elem.addClass(self.config.classNames.open);
        },

        /**
         * Close the dropdown.
         */
        close: function() {
            var self  = this;

            if ( ! self.is('open')) {
                return;
            }

            self.$menu.transition(self.config.transition + 'Out', {
                queue: false,
                onEnd: self.config.onClose.bind(self.elem)
            });

            self.$elem.removeClass(self.config.classNames.open);
        }

    });

    /**
     * Transform a ordinary <select> into a dropdown.
     *
     * @param element
     */
    function transform(element) {
        var $select  = $(element);
        if ( ! $select.is('select')) {
            return element;
        }

        var classNames = $.fn[plugin].defaults.classNames,
            $options   = $select.find('option'),
            $selected  = $options.filter(':selected'),
            $dropdown  = $('<div/>', {
                class: classNames.dropdown + ' ' + classNames.select,
                tabindex: 0
            }),
            $menu  = $('<ul/>', {
                class: classNames.menu
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
                    'class'      : 'menu__item',
                    'text'       : $option.text(),
                    'data-value' : $option.val()
                }).appendTo($menu);
            } else {
                $label.text( $option.text() );
            }
        });

        // Inherit selection
        if ($selected.val()) {
            $label.text( $selected.text() );
            $input.val( $selected.val() );
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
            var element = transform(this),
                data    = $.data(this, plugin);

            if ( ! data) {
                $.data(element, plugin, new Dropdown(element, settings));
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
        onOpen   : function() {},
        onSelect : function() {},
        onClose  : function() {}
    };

})(jQuery, window);
