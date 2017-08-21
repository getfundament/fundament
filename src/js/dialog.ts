import Plugin from './plugin';

export default class Dialog extends Plugin {

    /**
     * @constructor
     *
     * @param {HTMLElement} element
     * @param {Object} settings
     */
    constructor(element: HTMLElement, settings: Object) {
        super(element, settings);
        console.log('Hello dialog');
    }

}
