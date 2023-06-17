/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();

const { logIn, signUp } = require("./clientfunc/auth.js");

router.route("/logIn").post(logIn);
router.route("/signUp").post(signUp);

module.exports = router;
