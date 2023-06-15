/* eslint-disable no-undef */
const base = require("./mongodb.js");

function userLogIn(value) {
  let userData = base.getData(value.name);
  if (userData != null) {
    if (userData.password == value.password) return true;
    else return false;
  }
  return null;
}

module.exports = { logIn: userLogIn };
