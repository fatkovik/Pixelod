/**
 * Imports
 *
 */
import { packager } from "@electron/packager";

/**
 * Constants
 *
 */
const AUTHOR = "Geoffrey Mattie";
const TITLE = "Data Pixels Playground";
const ICON_PATH = "../source/images/icons/";
const OUT_PATH = "./releases/";

/**
 * Platform specific packager options
 *
 */
const platforms = {

    linux: {

        platform: "linux",
        icon: `${ICON_PATH}icon.png`
    },
    mac: {

        platform: "darwin",
        icon: `${ICON_PATH}icon.icns`,
        appBundleId: "com.mattie.DataPixelsPlayground"
    },
    windows: {

        platform: "win32",
        icon: `${ICON_PATH}icon.ico`,
        win32metadata: {

            CompanyName: AUTHOR,
            FileDescription: TITLE,
            OriginalFilename: TITLE,
            ProductName: TITLE
        }
    }
};

/**
 * Packages the application for the platform named by the first command-line argument.
 *
 */
const target = platforms[process.argv[2]];

if (!target) {

    console.error(`Usage: node package.js <${Object.keys(platforms).join("|")}>`);
    process.exit(1);
}

const appPaths = await packager({

    ...target,
    dir: "./",
    name: TITLE,
    arch: "x64",
    asar: true,
    overwrite: true,
    out: OUT_PATH,
    appCopyright: `Copyright © ${AUTHOR}`,
    ignore: [/^\/releases($|\/)/, /^\/package\.js$/, /^\/CLAUDE\.md$/]
});

console.log(`Packaged: ${appPaths.join(", ")}`);
