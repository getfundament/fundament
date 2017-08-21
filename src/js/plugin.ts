import { DialogSettings } from "./interfaces/settings.dialog.interface";

export class Plugin {

    /**
     * @constructor
     *
     * @param {HTMLElement} element
     * @param {DialogSettings} settings
     */
    constructor(element: HTMLElement, settings: DialogSettings) {
        console.log('Hello plugin');
    }

}
