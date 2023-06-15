const glslify = require("rollup-plugin-glslify");
const json = require("@rollup/plugin-json");
const eslint = require("@rollup/plugin-eslint");
const babel = require("@rollup/plugin-babel");
const uglify = require("rollup-plugin-uglify-es");
const terser = require("@rollup/plugin-terser");

module.exports = {
  input: "src/main.js",
  output: {
    dir: "dist",
    format: "iife",
    name: "main.js",
    sourcemap: "inline",
  },
  plugins: [
    json(),
    glslify(),
    eslint({ exclude: ["src/*.vert", "src/*.json"] }),
    babel({ exclude: ["node_module/**"] }),
    uglify(),
    terser(),

  ],

};
// node_modules\.bin\rollup.cmd -c
// npm install rollup/plugin-eslint
// node_modules\.bin\rollup.cmd -c --watch
// npm i rollup-plugin-uglify-es -D
