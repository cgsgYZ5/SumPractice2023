const json = require("@rollup/plugin-json");
const eslint = require("@rollup/plugin-eslint");
const babel = require("@rollup/plugin-babel");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");

const glslify = require("rollup-plugin-glslify");

const terser = require("@rollup/plugin-terser");

module.exports = {
  input: "src/main.js",
  output: {
    dir: "dest",
    format: "iife",
    // name: "main.js",
    // sourcemap: "inline",
  },
  plugins: [
    json(),
    glslify(),
    eslint({
      exclude: [
        "src/*.vert",
        "src/*.json",
        "src/coords/*.txt",
        "src/coords/*.obj",
        "src/bin/shaders/**",
      ],
    }),
    resolve({ jsnext: true, main: true, browser: true }),
    commonjs(),
    babel({
      babelHelpers: "bundled",
      exclude: ["node_module/**", "src/coords/**", "src/bin/**"],
    }),
    terser(),
  ],
};
// node_modules\.bin\rollup.cmd -c
// npm install rollup/plugin-eslint
// node_modules\.bin\rollup.cmd -c --watch
// npm i rollup-plugin-uglify-es -D
