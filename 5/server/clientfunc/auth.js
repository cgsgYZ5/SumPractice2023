/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const users = require("../users.js");

exports.signUp = async (req, res) => {
  let { name, password } = req.body;
  let user = await users.findInBase(name);
  if (user != null)
    res.status(401).json({
      messange: "User name ever have been taken",
    });
  else {
    user = await users.registrate(name, password);
    if (!user)
      res.status(400).json({
        messange: "User basa not work",
      });
    else res.status(201).json({ name: name });
  }
};
exports.logIn = async (req, res) => {
  let { name, password } = req.body;
  let user = await users.findInBase(name);
  if (user == null)
    res.status(100).json({
      messange: "User not found",
    });
  else if (user.password != password)
    res.status(101).json({
      messange: "Password incorrect",
    });
  else res.status(201).json({ name: name });
};
