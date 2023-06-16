/* eslint-disable no-undef */
const base = require("./mongodb.js");

async function userFind(name, id) {
  if (name != undefined) {
    let user = await base.getData("Users", { name: name });
    if (user.length != 0 && user.lengt != 1 && user.length != [])
      console.log(user);
    return user;
  } else if (id != undefined) {
    let user = await base.getData("Users", { _id: id });
    if (user.length != 0 || user.lengt != 1) console.log(user);
    return user;
  } else return null;
}
async function userRegistrate(name, role, password) {
  if (role != undefined) role = "user";
  let user = await base.addData("Users", {
    name: name,
    pasword: password,
    role: name == "admin" ? "admin" : "user",
  });

  if (!user) return { status: false };
  else
    return {
      status: true,
      id: user.insertedId,
    };
}
module.exports = { registrate: userRegistrate, find: userFind };
