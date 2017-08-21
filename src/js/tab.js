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
                    data[settings].apply(data, Array.isArray(args) ? args : [args]):
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
