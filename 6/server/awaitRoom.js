const clients = require("./clients.js");
const session = require("./session.js");

const awaitQueue = [];

function addToAwait(socket) {
  let user = clients.findActiveUser({ socket: socket });
  if (user == null) {
    socket.emit("error", "User have not active");
    return;
  }
  if (user[0].room != undefined) {
    socket.emit("error", "User ever in room");
    return;
  }

  for (let i = 0; i < awaitQueue.length; i++)
    if (awaitQueue[i].users.length < awaitQueue[i].type) {
      user[0].room = i;
      awaitQueue[i].users.push(socket);
      break;
    }
  if (user[0].room == undefined) {
    user[0].room = awaitQueue.length;
    awaitQueue.push({ name: "", type: 1, users: [socket] });
  }

  socket.emit("addToAwaitRoom", user[0].room);
  if (awaitQueue[user[0].room].users.length == awaitQueue[user[0].room].type)
    startRoom(user[0].room);
}
function startRoom(noofRoom) {
  let sessionId = "id" + Math.random().toString(16).slice(2);
  awaitQueue[noofRoom].users.forEach((socket) => {
    socket.emit("addGameRoom", sessionId);
  });
  session.create(sessionId, awaitQueue[noofRoom].type);
  awaitQueue.slice(noofRoom, 1);
}

function delFromAwait(socket, noofRoom) {
  if (noofRoom == undefined) return;
  const ind = awaitQueue[noofRoom].users.indexOf(socket);

  if (ind >= 0) {
    awaitQueue[noofRoom].users.splice(ind, 1);
  }
}

module.exports = {
  addToAwait: addToAwait,
  delFromAwait: delFromAwait,
};
