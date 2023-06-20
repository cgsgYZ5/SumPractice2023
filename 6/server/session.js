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
    selfObj: {
      name: "tank",
      info: { type: "vfvf" /*"tank"*/, pos: pos, angle: 0, userName: userName },
    },
    view: [],
    isNeedToReaction: false,
    isNeedToDraw: true,

    moveFront: null,
    moveBack: null,
    rotateLeft: null,
    rotateRight: null,
  };
  //
  playerObj.view.push(playerObj.selfObj);
  for (let i = 0; i < this.playerObj.length; i++) {
    if (len(this.playerObj[i].pos, pos) < viewCoeff) {
      this.playerObj[i].view.push(playerObj.selfObj);
      this.playerObj[i].isNeedToDraw = true;

      playerObj.view.puch(this.playerObj[i].selfObj);
      this.isNeedToDraw = true;

      //this.playerObj[i];
    }
  }
  this.playerObj[userName] = playerObj;
  return pos;
};
const update = function () {
  for (let i = 0; i < this.users.length; i++) {
    const player = this.playerObj[this.users[i].name];
    console.log(player.selfObj.info.angle);
    if (player.isNeedToReaction) {
      if (player["moveFront"]) player["moveFront"]();
      if (player["moveBack"]) player["moveBack"]();
      if (player["rotateLeft"]) player["rotateLeft"]();
      if (player["rotateRight"]) player["rotateRight"]();
      player.isNeedToDraw = true;
      //if (player.actions[j]) player.actions[j]();
    }
    if (player.isNeedToDraw) {
      this.users[i].socket.emit(
        "sessionUpdate",
        this.playerObj[this.users[i].name].view
      );
      player.isNeedToDraw = false;
    }
  }
};
const start = function () {
  this.isStarted = true;
  this.stopId = setInterval(() => this.update(), 100);
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
    user.sessionId = sessionId;
    activeSession.users.push(user);
    activeSession.playerObj[user.name].isNeedToDraw = true;
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
  if (ind >= 0) {
    activeSession.playerObj[user.name]["moveFront"] = null;
    activeSession.playerObj[user.name]["moveBack"] = null;
    activeSession.playerObj[user.name]["rotateLeft"] = null;
    activeSession.playerObj[user.name]["rotateRight"] = null;
    activeSession.playerObj[user.name].isNeedToReaction = false;
    activeSession.users.splice(ind, 1);
  }
}
function addAction(socket, sessionId, noofAction, action) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) {
    socket.emit("error", "Session id not valid", null, "home");
    return;
  }
  for (let i = 0; i < activeSession.users.length; i++)
    if (activeSession.users[i].socket == socket) {
      const name = activeSession.users[i].name;
      activeSession.playerObj[name][noofAction] = action;
      activeSession.playerObj[name].isNeedToReaction = true;
      return;
    }
}
function delAction(socket, sessionId, noofAction) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) {
    socket.emit("error", "Session id not valid", null, "home");
    return;
  }
  for (let i = 0; i < activeSession.users.length; i++)
    if (activeSession.users[i].socket == socket) {
      const name = activeSession.users[i].name;
      activeSession.playerObj[name][noofAction] = null;
      if (
        !activeSession.playerObj[name]["moveFront"] &&
        !activeSession.playerObj[name]["moveBack"] &&
        !activeSession.playerObj[name]["rotateLeft"] &&
        !activeSession.playerObj[name]["rotateRight"]
      )
        activeSession.playerObj[name].isNeedToReaction = false;
      return;
    }
}
module.exports = {
  create: create,
  addUser: addUser,
  delUser: delUser,
  addAction: addAction,
  delAction: delAction,
};
