const viewCoeff = 100;

const sessions = [];

const posInMap = {
  1: [{ x: 10, y: 10 }],
  2: [
    { x: 10, y: 10 },
    { x: 100, y: 100 },
  ],
  3: [
    { x: 10, y: 10 },
    { x: 100, y: 100 },
    { x: 200, y: 200 },
  ],
};

function len(pos1, pos2) {
  return (
    (pos1.x - pos2.x) * (pos1.x - pos2.x) +
    (pos1.y - pos2.y) * (pos1.y - pos2.y)
  );
}

// function objAdd(sessionId, type, info, pos) {
//   const view = [];

//   sessionObj.forEach((obj) => {
//     if (len(obj.pos, pos) < viewCoeff) view.push(obj);
//   });
//   sessionObj.push({ type: type, info: info, pos: pos, view: view });
// }
const addPlayer = function (pos, userName) {
  let playerObj = {
    selfObj: { name: "tank", info: { type: "vfvf" /*"tank"*/, pos: pos } },
    view: [],
  };
  //
  playerObj.view.push({
    name: "tank",
    info: { type: "self" /*"tank"*/, pos: pos, angle: 0 },
  });
  for (let i = 0; i < this.playerObj.length; i++) {
    if (len(this.playerObj[i].pos, pos) < viewCoeff) {
      this.playerObj[i].view.push(playerObj.selfObj);
      playerObj.view.puch(this.playerObj[i].selfObj);
    }
  }
  this.playerObj[userName] = playerObj;
  return pos;
};
const update = function () {
  for (let i = 0; i < this.users.length; i++) {
    this.users[i].socket.emit(
      "sessionUpdate",
      this.playerObj[this.users[i].name].view
    );
  }
};
const start = function () {
  this.isStarted = true;
  this.stopId = setInterval(() => this.update(), 1000);
};
function create(sessionId, type) {
  sessions[sessionId] = {
    users: [],
    type: type,
    staticObj: [], ///
    playerObj: {},
    moveObj: [], ///
    update: update,
    addPlayer: addPlayer,
    start: start,
    stopId: null,
    isStarted: false,
  };
}

function addUser(user, sessionId) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) {
    user.socket.emit("error", "Incorrect session", null, "home");
    return;
  }
  if (!activeSession.isStarted) {
    user.sessionId = sessionId;
    user.socket.emit(
      "gameConnect",
      activeSession.addPlayer(
        posInMap[activeSession.type][activeSession.users.length],
        user.name
      )
    );
    activeSession.users.push(user);
    if (activeSession.type == activeSession.users.length) activeSession.start();
  } else if (activeSession.playerObj[user.name] != undefined) {
    activeSession.users.push(user);
    user.socket.emit(
      "gameConnect",
      activeSession.playerObj[user.name].selfObj.info.pos
    ); /*
    else {
      user.socket.emit("error", `No have player with ${user.name} name`);
      return;
    }*/
  }
}
function delUser(user, sessionId) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) return;

  const ind = activeSession.users.indexOf(user);
  if (ind >= 0) activeSession.users.splice(ind, 1);
}

module.exports = {
  create: create,
  addUser: addUser,
  delUser: delUser,
};
