/* eslint-disable no-undef */
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");

module.exports = {
  input: "client/src/login.js",
  output: {
    file: "client/html/login.js",
    format: "iife",
    sourcemap: "inline",
    name: "cookie",
  },
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
  ],
};
