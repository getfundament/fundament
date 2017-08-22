import Core from './core'
import Config from './interfaces/config.interface';

abstract class Plugin {

    /* The name of the plugin */
    public abstract name: string;

    /* The public methods of the plugin */
    public abstract methods: Array<string>;

    /* The main element */
    public elem: HTMLElement;

    /* The main jQuery object */
    public $elem: JQuery;

    /* The plugin configuration */
    public config: Config;

    /* The plugin namespace */
    public namespace: string;

    /**
     * @constructor
     *
     * @param {string} plugin
     * @param {HTMLElement} element
     * @param {Config} config
     */
    constructor(plugin: string, element: HTMLElement, config: Config) {
        this.elem      = element;
        this.$elem     = jQuery(element);
        this.config    = jQuery.extend({}, jQuery.fn[plugin].defaults, config);
        this.namespace = plugin + '.' + Core.createId();
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

}

export default Plugin;
