//Imports
import { SharedStates as S } from "./support/sharedStates.js";
import * as App from "./application/app.js";
import * as C from "./support/constants.js";
import * as C_IPC from "../../build/js/support/constants.js";
import * as File from "./application/file.js";
import * as Content from "./application/content.js";

/**
 * @description The <strong>index.js</strong> module is the entry point for the application and contains Inter-Process Communication (IPC) logic for Electron.
 * @requires app
 * @requires constants
 * @requires constantsIPC
 * @requires file
 * @requires content
 * @requires sharedStates
 * @module
 * 
 */
export {

    exportClassFile,
    updateElectronOrientationMenuItems,
    updateElectronRunMenuItem,
    updateElectronFrameViewMenuItems
};

/**
 * @description An object containing the following members with module scope:
 * <ul>
 *     <li> Electron </li>
 *     <li> IPCRenderer </li>
 *     <li> NodeFileSystem </li>
 *     <li> NodePath </li>
 * </ul>
 * 
 * @private
 * @constant
 * 
 */
const M = {

    Electron: undefined,
    IPCRenderer: undefined,
    NodeFileSystem: undefined,
    NodePath: undefined
};

/**
 * Determines if the current environment supports Electron, and if so, defines the module members accordingly.
 * @private
 * @constant
 * 
 */
const isElectronEnvironment = (typeof window.require === C.Type.FUNCTION && window.require(C_IPC.Electron.ELECTRON));

if (isElectronEnvironment) {

    M.Electron = window.require(C_IPC.Electron.ELECTRON);
    M.IPCRenderer = M.Electron.ipcRenderer;
    M.NodeFileSystem = window.require(C_IPC.Electron.NODE_FILE_SYSTEM);
    M.NodePath = window.require(C_IPC.Electron.NODE_PATH);

    initElectronInterface();
}

/**
 * Initializes the application.  This must occur after the module members above are defined
 * because the application modules call back into the exported functions of this module.
 *
 */
App.init();

/**
 * @description Initializes the Electron interface for the application
 * @private
 * @function
 * 
 */
function initElectronInterface() {
    
    if (isElectronEnvironment) {

        M.IPCRenderer.on(C_IPC.Event.REQUEST_EXECUTE_BUTTON, updateElectronRunMenuItem);
        M.IPCRenderer.on(C_IPC.Event.REQUEST_ORIENTATION, updateElectronOrientationMenuItems);
        M.IPCRenderer.on(C_IPC.Event.REQUEST_FRAME_VIEW_HAS_IMAGE, updateElectronFrameViewMenuItems);
        
        M.IPCRenderer.on(C_IPC.Event.MENU_IMPORT_IMAGE_FILE, async () => {

            const filePath = await M.IPCRenderer.invoke(C_IPC.Event.DIALOG_OPEN_IMAGE, [C.Type.IMAGE_JPG, C.Type.IMAGE_PNG, C.Type.IMAGE_GIF]);

            if (!filePath) return;

            M.NodeFileSystem.readFile(filePath, (error, data) => {

                if (error) {

                    return App.setErrorMessage(error);
                }

                const blob = new Blob([data]);
                File.readImageFile(blob, M.NodePath.basename(filePath));
            });
        });
        
        M.IPCRenderer.on(C_IPC.Event.MENU_EXPORT_DATA_PIXELS_FILE, App.loadDataPixelsClassCode);
        M.IPCRenderer.on(C_IPC.Event.MENU_RUN, App.executeCode);
        M.IPCRenderer.on(C_IPC.Event.MENU_SETTINGS, App.displaySettingsDialog);
        
        M.IPCRenderer.on(C_IPC.Event.MENU_LAYOUT_HORIZONTAL, () => {

            S.Orientation = C_IPC.Orientation.HORIZONTAL;
            App.toggleLayout();
        });

        M.IPCRenderer.on(C_IPC.Event.MENU_LAYOUT_VERTICAL, () => {

            S.Orientation = C_IPC.Orientation.VERTICAL;
            App.toggleLayout();
        });

        M.IPCRenderer.on(C_IPC.Event.MENU_RESET, Content.resetImageTransform);
        M.IPCRenderer.on(C_IPC.Event.MENU_SCALE_UP, () => Content.updateImageTransform(null, null, true));
        M.IPCRenderer.on(C_IPC.Event.MENU_SCALE_DOWN, () => Content.updateImageTransform(null, null, false));
        M.IPCRenderer.on(C_IPC.Event.MENU_REFLECT_HORIZONTAL, () => Content.updateImageTransform(null, null, null, true));
        M.IPCRenderer.on(C_IPC.Event.MENU_REFLECT_VERTICAL, () => Content.updateImageTransform(null, null, null, null, true));
        M.IPCRenderer.on(C_IPC.Event.MENU_ABOUT, App.displayAboutDialog);
        M.IPCRenderer.on(C_IPC.Event.MENU_EXAMPLE_BASIC, () => App.writeExampleCode(C.Example.BASIC));
        M.IPCRenderer.on(C_IPC.Event.MENU_EXAMPLE_HEARTS, () => App.writeExampleCode(C.Example.HEARTS));
        M.IPCRenderer.on(C_IPC.Event.MENU_EXAMPLE_MARIO_BROS, () => App.writeExampleCode(C.Example.MARIO_BROS));
    }
}

/**
 * @description Opens the Electron / NodeJS "Save As..." dialog to export the DataPixels.js class file.
 * @param {string} dataPixelsClassCode - The XMLHttpRequest responseText from loading the DataPixels.js class file.
 * @public
 * @function
 *  
 */
async function exportClassFile(dataPixelsClassCode) {

    const fileName = await M.IPCRenderer.invoke(C_IPC.Event.DIALOG_SAVE_CLASS);

    if (!fileName) return;

    M.NodeFileSystem.writeFile(fileName, dataPixelsClassCode, (error) => {

        if (error) {

            App.setErrorMessage(error);
        }
    });
}

/**
 * @description Updates the enabled state of the Electron menu item "Run" according to the state of its counterpart in the Renderer Process. 
 * @public
 * @function
 * 
 */
function updateElectronRunMenuItem() {

    if (isElectronEnvironment) {

        M.IPCRenderer.send(C_IPC.Event.UPDATE_EXECUTE_BUTTON, C.HTMLElement.BUTTON_EXECUTE.disabled);
    }
} 

/**
 * @description Updates the enabled state of the Electron menu items "Layout Horizontal" and "Layout Vertical" according to the state of their counterparts in the Renderer Process.
 * @public
 * @function
 * 
 */
function updateElectronOrientationMenuItems() {

    if (isElectronEnvironment) {

        M.IPCRenderer.send(C_IPC.Event.UPDATE_ORIENTATION, S.Orientation);
    }
}

/**
 * @description Updates the enabled state of the Electron menu items "Reset", "Scale Up / Down" and "Reflect Horizontally / Vertically" according to the state of their counterparts in the Renderer Process.
 * @public
 * @function
 * 
 */
function updateElectronFrameViewMenuItems() {

    if (isElectronEnvironment) {

        M.IPCRenderer.send(C_IPC.Event.UPDATE_FRAME_VIEW_HAS_IMAGE, S.FrameViewHasImage);
    }
}