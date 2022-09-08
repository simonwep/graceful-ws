import {terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';
import typescript from '@rollup/plugin-typescript';

const banner = `/*! Graceful WebSocket ${pkg.version} MIT | https://github.com/Simonwep/graceful-ws */`;

export default {
    input: 'src/index.ts',
    plugins: [
        typescript(),
        terser({
            mangle: {
                keep_classnames: true,
                properties: {
                    regex: /^_/
                }
            }
        }),
        replace({
            VERSION: JSON.stringify(pkg.version),
            preventAssignment: true
        })
    ],
    output: [
        {
            banner,
            file: pkg.main,
            name: 'GracefulWebSocket',
            format: 'umd',
            sourcemap: true
        },
        {
            banner,
            file: pkg.module,
            format: 'es',
            sourcemap: true
        }
    ]
};
