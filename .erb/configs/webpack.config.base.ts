/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import { dependencies as externals } from '../../release/app/package.json';
import webpackPaths from './webpack.paths';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';

const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default;

const styledComponentsTransformer = createStyledComponentsTransformer();

const configuration: webpack.Configuration = {
    externals: [...Object.keys(externals || {})],

    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.[jt]sx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        // Remove this line to enable type checking in webpack builds
                        transpileOnly: true,
                        getCustomTransformers: () => ({ before: [styledComponentsTransformer] }),
                    },
                },
            },
        ],
    },

    output: {
        // https://github.com/webpack/webpack/issues/1114
        library: {
            type: 'commonjs2',
        },

        path: webpackPaths.srcPath,
    },

    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
            FS_SERVER_NAME: process.env.SERVER_URL ?? null,
            FS_SERVER_URL: process.env.SERVER_URL ?? null,
            FS_SERVER_TYPE: process.env.SERVER_URL ?? null,
            FS_SERVER_USERNAME: process.env.SERVER_URL ?? null,
            FS_SERVER_PASSWORD: process.env.SERVER_URL ?? null,
        }),
    ],

    /**
     * Determine the array of extensions that should be used to resolve modules.
     */
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        fallback: {
            child_process: false,
        },
        plugins: [new TsconfigPathsPlugin({ baseUrl: webpackPaths.srcPath })],
        modules: [webpackPaths.srcPath, 'node_modules'],
    },

    stats: 'errors-only',
};

export default configuration;
