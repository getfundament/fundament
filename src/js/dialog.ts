import Plugin from './plugin';
import Core from './core';
import Config from './interfaces/config.dialog.interface';
import * as $ from 'jquery';

const TEST = '';

const Dialog = (($, window, document) => {

    /** Constants */
    const pName    = 'dialog',
          pMethods = ['toggle', 'open', 'close', 'setting'];

    const $window   = $(window),
          $document = $(document),
          $body     = $(document.body);

    const transitionEndEvent = Core.transitionEnd();

    /** Class definition */
    class Dialog extends Plugin {

        /* The dimmer element */
        public $dimmer: $;

        /* Whether the dialog is busy transitioning */
        public busy: boolean;

        /**
         * @constructor
         *
         * @param {HTMLElement} element
         * @param {Config} config
         */
        constructor(element: HTMLElement, config: Config) {
            super(element, config);
            this.$dimmer = $('<div/>');//, {class: this.config.classNames.dimmer});
            this.busy    = false;
            //this.name = pName;
            this.init();
        }

        static get Name() {
            //return pName;
        }

        /**
         * Initialize the plugin
         */
        init() {
            console.log('Hello dialog', this);
        }

        /**
         * Bind event handlers.
         */
        bind() {

        }

    }

    /** jQuery implementation */
    $.fn[pName] = function(settings, args) {
        return this.each(function() {
            const data = $.data(this, pName);

            if ( ! data) {
                $.data(this, pName, new Dialog(this, settings));
            } else if (typeof settings === 'string') {
                pMethods.indexOf(settings) > -1 ?
                    data[settings].apply(data,Array.isArray(args) ? args : [args]):
                    console.warn(pName + ': Trying to call a inaccessible method');
            }
        });
    };

    return Dialog;

})(jQuery, window, document);

export default Dialog;
