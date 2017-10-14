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
