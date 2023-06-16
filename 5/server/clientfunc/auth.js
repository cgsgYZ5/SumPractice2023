/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const users = require("../users.js");

exports.signUp = async (req, res, next) => {
  let { name, password } = req.body;
  let user = await users.find(name);
  if (user[0] != null)
    res.status(401).json({
      message: "User name ever have been taken",
    });
  else {
    user = await users.registrate(
      name,
      password,
      name == "admin" ? "admin" : undefined
    );
    if (!user.status)
      res.status(400).json({
        message: "User basa not work",
      });
    else res.status(201).json(user.id);
  }
};
exports.logIn = async (req, res, next) => {
  let logInStatus = (await user.getData("Users", { name: req.body.name }))[0];
  if (logInStatus != null) return logInStatus._id;
  else throw "Password no correct";
};
