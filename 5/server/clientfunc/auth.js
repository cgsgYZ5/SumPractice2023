/* eslint-disable no-unused-vars */
const user = require("../mongodb");

exports.signUp = async (req, res, next) => {
  let input = JSON.parse(req.body);
  let logInStatus = (await user.getData("Users", { name: input.name }))[0];
  if (logInStatus != null) throw "User name ever have been taken";
  else {
    logInStatus = await user.addData("Users", JSON.parse(req.body));
    if (logInStatus) throw "User basa not work";
    else return logInStatus._id;
  }
};
exports.logIn = async (req, res, next) => {
  let logInStatus = (await user.getData("Users", { name: req.body.name }))[0];
  if (logInStatus != null) return logInStatus._id;
  else throw "Password no correct";
};
