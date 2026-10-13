# resources/build — Electron app package + build output

This folder is the app as Electron sees it. It has its **own `package.json`** (`"type": "module"`, `main: ./js/main/index.js`; dep: `electron-window-state`; dev: `electron ^44`, `@electron/packager`). Run `npm i` here separately from the repo root.

## Hand-written (tracked)

| Path | Role |
|---|---|
| `js/main/index.js` | Main process (native ESM): `BrowserWindow` (1000x600 default, min 800x600, persisted via `electron-window-state`, `nodeIntegration: true`, `contextIsolation: false`), full menu template, ESC-exits-fullscreen global shortcut, IPC handlers incl. open/save dialogs (`ipcMain.handle`), `setWindowOpenHandler` -> `shell.openExternal`. Uses `import.meta.url` for `__dirname`. |
| `js/support/constants.js` | IPC-side constants: `Electron`, `Event` (IPC channel names), `Label`, `Keys`, `Role`, `Orientation`, `FileSource`. **Imported by both main and renderer** (`../../../build/js/support/constants.js`), so it must stay free of Node/DOM-only code. |
| `data/DataPixels.js` | Runtime copy of the library, fetched by XHR from the renderer. Must match `../source/js/dataPixels/DataPixels.js`. |
| `package.js` | `node package.js linux\|mac\|windows` -> `@electron/packager` API (asar, x64, icons from `../source/images/icons`, output `./releases/`). Used by the `package-*` npm scripts. |
| `fonts/`, `images/`, `license` | Static assets referenced by the emitted CSS/HTML (webpack does not copy them). |

## Generated (gitignored; only `.keep` is tracked)

`js/renderer/index.js`, `css/index.css`, `index.html` — produced by `npm run dev|prod` from the repo root. `releases/` receives packaged apps.

## IPC contract

Menu click (main) -> `webContents.send(Event.MENU_*)` -> renderer handler in `source/js/index.js`.
Dialogs: renderer `invoke(Event.DIALOG_OPEN_IMAGE, extensions)` / `invoke(Event.DIALOG_SAVE_CLASS)` -> main shows the dialog and returns the path (or `null`).
Renderer -> main state sync: `UPDATE_EXECUTE_BUTTON`, `UPDATE_ORIENTATION`, `UPDATE_FRAME_VIEW_HAS_IMAGE`; main asks for them with `REQUEST_*` after `did-finish-load`.
Adding a menu item: add label/event in `constants.js`, add to `menuTemplate`, update the index-based `M.MenuItem.*` lookups in `createMenu()`, add the `ipcRenderer.on` in `source/js/index.js`.

## Running the app

`npm run prod` at repo root first, then `npm run build` here (= `electron .`). Opening the renderer in a plain browser (`npm run dev` serves :3000) also works for editor/preview, minus Electron-only menu/file features (`isElectronEnvironment` guard in `source/js/index.js`).
