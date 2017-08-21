import Config from "./config.interface";

interface DialogConfig extends Config {

    /* The element from which the dialog should open */
    openFrom: JQuery,

    /* Whether or not the dialog closes when clicking on the dimmer */
    closable: boolean,

    /* Auto focus on the first focusable element */
    autoFocus: boolean,

    /* The transition being applied to the dialog */
    transition: string,

}

export default DialogConfig;
