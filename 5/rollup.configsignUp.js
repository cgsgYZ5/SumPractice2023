/* eslint-disable no-undef */
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");

module.exports = {
  input: "client/src/signup.js",
  output: {
    file: "client/html/signup.js",
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
