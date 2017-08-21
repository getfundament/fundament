import Core from './core'
import Config from './interfaces/config.interface';
import * as $ from "jquery";

abstract class Plugin {

    /* The main element */
    public elem: HTMLElement;

    /* The main jQuery object */
    public $elem: $;

    /* The plugin configuration */
    public config: Config;

    /* The plugin namespace */
    public namespace: string;

    /**
     * @constructor
     *
     * @param {HTMLElement} element
     * @param {Config} config
     */
    constructor(element: HTMLElement, config: Config) {
        this.elem      = element;
        this.$elem     = $(element);
        this.config    = $.extend({}, $.fn['dialog'].defaults, config);
        this.namespace = 'dialog.' + Core.createId();
        console.log('Hello plugin', this);
    }

    /**
     * Initialize the plugin.
     */
    abstract init(): void;

    /**
     * Bind event handlers.
     */
    abstract bind(): void;

    /**
     *  Get the name of the plugin.
     *
     *  @returns {string}
     */
    static name: () => string;

}

export default Plugin;
