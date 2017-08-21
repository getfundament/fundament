import { DialogSettings } from "./interfaces/settings.dialog.interface"
import { Plugin } from './plugin';

export default class Dialog extends Plugin {

    /**
     * @constructor
     *
     * @param {HTMLElement} element
     * @param {DialogSettings} settings
     */
    constructor(element: HTMLElement, settings: DialogSettings) {
        super(element, settings);
        console.log('Hello dialog');
    }

}
