;(function() {
    'use strict';

    // Definition

    var plugin = 'plugin',
        proto = Plugin.prototype;

    // Constructor

    function Plugin(elem, settings) {
        this.elem = elem;
        this.config = settings;
    }

    // Prototype

    proto.init = function() {

    };

    // Defaults

    proto.defaults = {
        duration: 300,
        onStart: function () {},
        onEnd: function () {}
    };

})();
