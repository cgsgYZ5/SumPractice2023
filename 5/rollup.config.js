const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");

module.exports = {
  input: "client/nolog.js",
  output: {
    file: "dist/nolog/bundle.js",
    format: "iife",
    sourcemap: "inline",
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
