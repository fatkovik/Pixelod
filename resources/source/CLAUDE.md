# resources/source — renderer (webpack input)

Entry: `js/index.js` + `sass/index.scss` (see `config/webpack.config.js`). Output goes to `../build/`.

## Modules (`js/`)

| File | Role |
|---|---|
| `index.js` | Entry. Calls `App.init()`, detects Electron via `window.require`, wires IPC menu events (`ipcRenderer.on`) to app functions; owns open/save dialogs (`exportClassFile`) and `updateElectron*MenuItems` replies to main. |
| `application/app.js` | Init, `readStates`/`writeStates` (localStorage), theme, code editor mode (AUTO vs MANUAL), `executeCode`, XHR load of `DataPixels.js`, error display. |
| `application/content.js` | Code editor (line numbers, tab handling), drag bar resize, frame view mouse pan/zoom/reflect (`updateImageTransform`). |
| `application/controls.js` | Toolbar buttons (run, settings, layout, reset/scale/reflect) and their enable/disable state. |
| `application/layout.js` | Horizontal/vertical orientation and flex sizing of editor vs frame view. |
| `application/file.js` | Drag-drop / opened image -> `DataPixelsCodeFactory` -> code in editor; size warning above `IMAGE_MAX_AREA` (10000 px). |
| `application/popups.js` | About / Settings / file-type-error / image-size dialogs built with `support/Dialog.js`. |
| `dataPixels/DataPixels.js` | Canonical library class. **Duplicate of `../build/data/DataPixels.js`** (the one actually loaded at runtime). Keep identical. |
| `dataPixels/DataPixelsCodeFactory.js` | Turns `ImageData` into formatted `pixelData` source (alignment, `R:`/`G:` descriptions, indentation) and the full generated program (`output`). Regex-heavy; serialised to localStorage via `JSON.stringify` + `fromJSON`. |
| `dataPixels/examples.js` | Template-literal example programs (basic, hearts, marioBros) shown from Help menu. |
| `support/constants.js` | All constants (`C`) incl. DOM element lookups at import time — `document.getElementById` runs on load, so ids in `index.html` must exist. |
| `support/sharedStates.js` | Sealed `SharedStates` (`S`) object — the app's global state. |
| `support/Dispatcher.js`, `Dialog.js` | Abstract event dispatcher and the modal dialog class extending it. |
| `support/utils.js` | `cleanFileName`, `setSelectElementIndexByValue`. |

## SCSS (`sass/`)

`index.scss` imports `modules/` (`sharedConstants`, `reset`, `fonts`, `animations`, `classes/{buttons,dialog,dragBar,themes}`). Themes are body classes (`C.CSSClass.THEME_DARK|LIGHT`), toggled in `app.setTheme`.

## `index.html`

Static shell, ids are contract with `C.HTMLElement` and `popups.js`. Loads `./js/renderer/index.js` and `./css/index.css`. Note two elements share `id="controls"` (top toolbar and the one inside `#frameViewControls`) — `getElementById` returns the first; don't "fix" without checking `constants.js`/`controls.js`.

## Images

`images/icons/*` are app icons used by the packager; `images/readme/*` only for README; `DataPixelsIcons.ai` is the Illustrator source for the UI icons in `../build/images`.
