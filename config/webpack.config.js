/**
 * Imports
 * 
 */
const path = require("path");

/**
 * Constants
 * 
 */
const BUILD_DIR = path.resolve(__dirname, "../resources/build/");
const SOURCE_DIR = path.resolve(__dirname, "../resources/source/");

/**
 * Plugins
 * 
 */
const CSSMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");

/**
 * The Webpack configuration object contains the following keys:
 * 
 *     Entry:  An object that dictates where Webpack enters the application to start building the bundles.
 *     Module:  Options that determine how the different types of modules within a project will be treated.
 *     Optimization:  Minimizers (JS via webpack defaults, CSS via CSSMinimizerPlugin) applied in Production mode.
 *     Output:  An object that dictates where Webpack will build the bundles.
 *     Plugins:  Customization of the Webpack build process.
 *     Stats:  Options that control the displayed bundle information during the build process.
 * 
 */

const config = {
    entry: {
        index: [
            path.resolve(SOURCE_DIR, "js/index.js"),
            path.resolve(SOURCE_DIR, "sass/index.scss")
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        configFile: path.resolve(__dirname, "babel.config.js")
                    }
                }
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCSSExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {

                            /*
                            *   This option bypasses the management of imported fonts and image files
                            *   by disabling url() handling.  Imported files must be available in their
                            *   proper locations, relative to the extracted CSS file, within the /build
                            *   folder. 
                            */

                            url: false
                        }
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                config: __dirname
                            }
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {

                                /*
                                *   The SCSS modules share variables, mixins and @extend targets through
                                *   global @import statements, which Dart Sass deprecates in favor of @use.
                                */

                                silenceDeprecations: ["import"]
                            }
                        }
                    }
                ]
            }
        ]
    },
    optimization: {

        /*
        *   The "..." keeps webpack's default JS minimizer (Terser) alongside the CSS minimizer.
        */

        minimizer: [
            "...",
            new CSSMinimizerPlugin()
        ]
    },
    output: {
        path: BUILD_DIR,
        filename: "./js/renderer/[name].js"
    },
    plugins: [
        new MiniCSSExtractPlugin({
            filename: "./css/[name].css"
        })
    ],
    devServer: {
        host: "localhost",
        port: 3000,
        static: {
            directory: BUILD_DIR
        },
        devMiddleware: {

            /*
            *   Emit bundles to the /build folder so that the Electron application, which
            *   loads from disk, always receives the latest compiled output.
            */

            writeToDisk: true
        }
    },
    stats: {
        entrypoints: false,
        children: false
    }
};

/**
 * Exported function module that returns the Webpack configuration object.  This function is
 * used to alter the configuration object according to the set "development" or "production"
 * build mode.  The following keys and plugins are modified:
 * 
 *     Devtool:  This option controls how source maps are generated.
 *     HTMLWebpackPlugin:  Copies and/or minifies "index.html" from the /source folder to the /build folder.
 * 
 */
module.exports = (env, argv) => {
    if (argv.mode === "development") {
        config.devtool = "inline-source-map";
    }

    config.plugins.push(
        new HTMLWebpackPlugin({
            inject: false,
            minify: (argv.mode === "production") ? {
                collapseWhitespace: true,
                removeComments: true
            } : {},
            template: path.resolve(SOURCE_DIR, "index.html"),
            filename: "index.html"
        })
    );

    return config;
};