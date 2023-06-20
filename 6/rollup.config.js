/* eslint-disable no-undef */
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");

module.exports = [
  {
    input: "client/src/homePage.js",
    output: {
      file: "client/dest/homePage/homePage.js",
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
  },
  {
    input: "client/src/login.js",
    output: {
      file: "client/dest/auth/login.js",
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
  },
  {
    input: "client/src/signup.js",
    output: {
      file: "client/dest/auth/signup.js",
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
  },
  {
    input: "client/src/game.js",
    output: {
      file: "client/dest/game/game.js",
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
  },
];
