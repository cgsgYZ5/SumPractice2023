/* eslint-disable no-undef */
const base = require("./mongodb.js");

async function userLogIn(value) {
  let userData = await base.getData("Users", { name: value.name });
  if (userData != null) {
    if (userData[0].password == value.password) return true;
    else return false;
  }
  return null;
}
async function userSignUp(value) {
  let isExist = await base.getData("Users", { name: value.name });
  if (isExist == true) return false;

  let userData = await base.addData("Users", {
    name: value.name,
    password: value.password,
  });
  return userData;
}

module.exports = { logIn: userLogIn, signUp: userSignUp };
