const Core = (($) => {

    function init() {
        console.log('Initializing');
    }

    /**
     * Public API
     */
    return {
        init: init
    }

})(jQuery);

export default Core;
