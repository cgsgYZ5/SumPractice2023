/* eslint-disable no-undef */
const base = require("./mongodb.js");

// const onlainClients = [];
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
// function create(name, socket) {
//   return { isOnlain: true, socket: socket, name: name };
// }

// async function userFindInBase(name) {
//   if (name != undefined) {
//     let user = await base.getOneData("Users", { name: name });
//     return user;
//   }
//   return null;
// }
// async function userFindActive(name) {
//   if (name != undefined) {
//     for (let i = onlainClients.length - 1; i >= 0; i--)
//       if (onlainClients[i].name == name) return onlainClients[i];
//   }
//   return null;
// }
// async function userRegistrate(name, password) {
//   let user = await base.addData("Users", {
//     name: name,
//     password: password,
//   });

//   if (!user) return false;
//   return true;
// }
// module.exports = {
//   registrate: userRegistrate,
//   findInBase: userFindInBase,
//   create: create,
//   findActive: userFindActive,
//   onlain: onlainClients,
// };
const activeUser = [];

function funcForActiveClients(func, ...args) {
  let resMass = [];
  for (let i = 0; i < activeUser.length; i++) {
    let res = func(activeUser[i], ...args, i);

    if (res != undefined) {
      if (res.isBreak != undefined) {
        if (res.data != undefined) resMass.push(res.data);
        if (res.isBreak) break;
      } else resMass.push(res);
    }
  }
  if (resMass.length == 0) return null;
  return resMass;
}
async function registrate(name, password) {
  let clients = await base.getDB("Users");
  let user = await clients.insertOne({
    name: name,
    password: password,
  });

  if (!user) return false;
  return true;
}
async function find(name) {
  if (name != undefined) {
    let clients = await base.getDB("Users");
    let user = await clients.findOne({ name: name });
    return user;
  }
  return null;
}
function addActiveUser(name, socket) {
  let activeUserName = [];
  funcForActiveClients(
    (user, activeUserName) => activeUserName.push(user.name),
    activeUserName
  );
  socket.emit("onlainUserUpdate-All", activeUserName);
  const user = {
    name: name,
    socket: socket,
    room: undefined,
    sessionId: undefined,
  };
  activeUser.push(user);
  return user;
}
function delActiveUser(socket) {
  return funcForActiveClients((user, socket, i) => {
    if (user.socket == socket) {
      activeUser.splice(i, 1);
      return { data: user, isBreak: true };
    }
  }, socket);
}
function findActiveUser(sito) {
  if (sito.name != undefined && sito.socket != undefined) {
    return funcForActiveClients((user, sito) => {
      if (user.name == sito.name && user.socket == sito.socket) return user;
    }, sito);
  } else if (sito.name != undefined && sito.socket == undefined) {
    return funcForActiveClients((user, sito) => {
      if (user.name == sito.name) return user;
    }, sito);
  } else if (sito.name == undefined && sito.socket != undefined) {
    return funcForActiveClients((user, sito) => {
      if (user.socket == sito.socket) return user;
    }, sito);
  }
  return activeUser;
}
function changeSocket(name, newSocket) {
  let users = findActiveUser({ name: name });
  users.forEach((user) => {
    user.socket = newSocket;
  });
}
module.exports = {
  registrate: registrate,
  find: find,
  addActiveUser: addActiveUser,
  delActiveUser: delActiveUser,
  findActiveUser: findActiveUser,
  changeSocket: changeSocket,
  funcForActiveClients: funcForActiveClients,
  // create: create,
  // findActive: userFindActive,
  // onlain: onlainClients,
};
