/* eslint-disable no-undef */
const base = require("./mongodb.js");

const onlainClients = [];
/*
class _user {
  isOnlain = false;
  socket = null;
  name;

  constructor(name, socket) {
    this.isOnlain = true;
    this.name = name;
    this.socket = socket;
  }
}

function create(...arg) {
  return new _user(...arg);
}
*/
function create(name, socket) {
  return { isOnlain: true, socket: socket, name: name };
}

async function userFindInBase(name) {
  if (name != undefined) {
    let user = await base.getOneData("Users", { name: name });
    return user;
  }
  return null;
}
async function userFindActive(name) {
  if (name != undefined) {
    for (let i = onlainClients.length - 1; i >= 0; i--)
      if (onlainClients[i].name == name) return onlainClients[i];
  }
  return null;
}
async function userRegistrate(name, password) {
  let user = await base.addData("Users", {
    name: name,
    password: password,
  });

  if (!user) return false;
  return true;
}
module.exports = {
  registrate: userRegistrate,
  findInBase: userFindInBase,
  create: create,
  findActive: userFindActive,
  onlain: onlainClients,
};
