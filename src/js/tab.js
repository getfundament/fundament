/**
 * Tab plugin.
 *
 * @package Fundament
 */
;(function($, window) {
    'use strict';

    var plugin   = 'tab';

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
            } else if (typeof settings === 'string' && data[settings]) {
                data[settings].apply(data, Array.isArray(args) ? args : [args]);
            }
        });
    };

    // Default settings
    $.fn[plugin].defaults = Defaults;

})(jQuery, window);
