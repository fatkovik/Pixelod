# Pixelod / Data Pixels Playground

Fork of gmattie's **Data-Pixels** (`origin` = `fatkovik/Pixelod`, MIT, v1.1.0). Two things live here:

1. **`DataPixels.js`** — a tiny ES2015 class: takes a 2D array of `"R, G, B[, A]"` strings + a pixel size and exposes `.canvas` / `.image` / `.imageData`.
2. **Data Pixels Playground** — an Electron desktop app (code editor + live preview iframe) for writing/running DataPixels code and for converting image files (png/jpg/gif) into `pixelData` code.

## Rules for Claude

- **Do NOT commit, create/switch branches, stage, stash, reset, push, or perform any other git operation unless the user explicitly says so.** Edit working-tree files only; read-only commands (`git status`, `git diff`, `git log`) are fine.

## Layout

```
config/                 webpack 5 / babel / postcss configs
resources/source/       renderer source (JS modules, SCSS, index.html)  -> see resources/source/CLAUDE.md
resources/build/        Electron main process, IPC constants, packaging, build output -> see resources/build/CLAUDE.md
package.json            (root) bundler deps + npm scripts
resources/build/package.json   (separate!) Electron runtime + packaging deps
```

Two independent npm projects: the root one bundles the renderer; `resources/build/` is the actual Electron app package.

## Commands

Root (`D:\Projects\Pixelod-master`):

| Command | What it does |
|---|---|
| `npm run dev` | `webpack serve` dev mode on http://localhost:3000, inline source maps, `writeToDisk` so Electron sees fresh output |
| `npm run dev-watch` | dev mode, plain `--watch` (no server) |
| `npm run prod` | webpack production (Terser + CSS minimizer + minified HTML) |
| `npm run dev-prod` | production mode with watch |

`resources/build/` (run `npm i` there too):

| Command | What it does |
|---|---|
| `npm run build` | `electron .` — launches the app (despite the name, it does not build) |
| `npm run package-windows` / `-mac` / `-linux` | `node package.js <platform>` -> `@electron/packager` into `resources/build/releases/` (package on the target OS) |

No test suite, no linter config exists.

## Toolchain (modernized on branch `modernize-toolchain`)

- Node >= 20 (tested on 22). Run `npm install` in the root **and** in `resources/build/`; the Electron binary downloads on install (if it does not: `node node_modules/electron/install.js`).
- Root: webpack 5, webpack-cli 7, webpack-dev-server 6, babel 8 / babel-loader 10, css-loader 7, `sass` (Dart Sass) + sass-loader, postcss 8 / postcss-loader 8, mini-css-extract-plugin 2, html-webpack-plugin 5, css-minimizer-webpack-plugin.
- `resources/build`: Electron 44, `@electron/packager`, `electron-window-state`. Main process is **native ESM** (`"type": "module"`); the old `esm` loader, `indexESM.js` and gulp are gone.
- `electron.remote` no longer exists: file dialogs run in the main process via `ipcMain.handle` (`Event.DIALOG_OPEN_IMAGE`, `Event.DIALOG_SAVE_CLASS`); the renderer calls `ipcRenderer.invoke` and still does the `fs` read/write itself.
- `BrowserWindow` uses `nodeIntegration: true, contextIsolation: false` because the renderer calls `window.require`. Moving to a preload + `contextBridge` is the next hardening step.
- The `data-pixels` npm package is not a dependency; `DataPixels.js` is vendored source (see below).
- Verified: `npm run prod` builds with no warnings, the app launches, Run renders an `IMG` in the Frame View with no console errors, and `npm run package-windows` produces a package. Menu-driven dialogs and macOS/Linux packaging were not exercised.

## Build pipeline

`resources/source/js/index.js` + `sass/index.scss` -> webpack -> `resources/build/js/renderer/index.js`, `resources/build/css/index.css`, `resources/build/index.html` (from `source/index.html`). All three outputs are gitignored (only `.keep` files are tracked) — **run `npm run prod` (or `dev`) before the app has anything to load.**

Gotchas:
- `css-loader` has `url: false`: fonts/images referenced in SCSS are NOT processed; they must already exist at `resources/build/fonts|images` relative to the emitted CSS.
- Babel excludes `node_modules`; targets come from `browserslist` in root `package.json`.
- SCSS still uses `@import` and global `@extend`/mixins; the Dart Sass `import` deprecation is silenced in the `sass-loader` options. Migrating to `@use` requires each module to `@use` the shared constants/mixins itself.
- Output keeps `const`/`let`, so circular-import TDZ errors that the old ES5 output hid now throw at load. Keep top-level calls out of cyclic modules until their own `const`s are defined (see the `App.init()` placement at the bottom of `source/js/index.js`).

## Architecture in one paragraph

Electron **main** (`resources/build/js/main/index.js`, native ES modules) creates the window, native menu and global ESC shortcut, and talks to the **renderer** only through IPC event names defined in `resources/build/js/support/constants.js` (shared by both processes — the renderer imports it by relative path). The renderer is a vanilla-JS single page: a `<textarea>` code editor, a drag bar, and an `<iframe id="frameView">`. "Run" injects `DataPixels.js` source + the user's code (with `import …` lines stripped by regex) as a `<script>` into the iframe. Image import: file -> `FileReader` -> `<canvas>` -> `ImageData` -> `DataPixelsCodeFactory` generates the `pixelData` code.

## Things to know before editing

- **`DataPixels.js` exists twice, byte-identical**: `resources/source/js/dataPixels/DataPixels.js` and `resources/build/data/DataPixels.js`. The app loads the **build/data** copy at runtime via XHR (`C.Code.SCRIPT_URL = "./data/DataPixels.js"`) for both execution and "Export DataPixels.js". The source copy is not imported by anything. Edit both (or copy) — nothing syncs them.
- Run-time code execution strips `export default DataPixels;` from the class text and wraps `class + user code` in an IIFE; keep `export default DataPixels;` verbatim at the end of the class file or that replace breaks.
- User code runs in the Frame View iframe of a window with `nodeIntegration` on. Sub frames do not get Node, but the iframe is same-origin with the parent, so user code can reach `parent.require`. Treat Run as arbitrary code execution; don't run untrusted code.
- App state persists in `localStorage` (keys in `C.Persistence`), written on `beforeunload`; `S` (`SharedStates`) is a sealed object — add new state in `sharedStates.js` *and* `readStates`/`writeStates` in `app.js`.
- Menu items are located by **array index** in `createMenu()` (`M.Menu.items[2 + menuOffset].submenu.items[4]`…). Reordering menu entries silently breaks the enable/disable wiring, and macOS adds a leading app menu (`menuOffset = 1`).
- Known small bug: `app.js` `XHRLoadHandler`/`XHRErrorHandler` call `removeEventListener(C.Event.LOAD, XHRErrorHandler)` — the second should be `C.Event.ERROR`.
- `README.md` documents the public `DataPixels.js` API and packaging; its examples use `import DataPixels from "data-pixels"`, while the in-app examples (`examples.js`) use `"./DataPixels.js"`.

## Code style (match it)

- 4-space indent, double quotes, semicolons, ES modules, blank line after the opening `{` of every function/block.
- Every module/function has a JSDoc block (`@description`, `@param`, `@public|@private`, `@function|@method`, closing ` * ` line); module-private mutable state lives in a single `const M = {...}`; exports are listed in an `export { … }` block at the top.
- Magic strings/numbers go in `support/constants.js` (`C`) as frozen objects; DOM lookups are in `C.HTMLElement`.
- Cross-module imports are circular in places (`app` <-> `content`/`controls`/`index`); keep calls inside functions, not at module top level.
