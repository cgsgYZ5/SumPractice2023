const tools = require("./tools.js");

const viewCoeff = 30000;

const sessions = [];

const posInMap = {
  1: [{ x: 10, y: 10 }],
  2: [
    { x: 0, y: -100 },
    { x: 0, y: 0 },
  ],
  3: [
    { x: 10, y: 10 },
    { x: 100, y: 100 },
    { x: 200, y: 200 },
  ],
};

function len2(pos1, pos2) {
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
  let thisObg = {
    selfObj: {
      name: "tank",
      info: {
        type: "vfvf" /*"tank"*/,
        pos: pos,
        angle: 0,
        userName: userName,
        scale: { x: 20, y: 20 },
      },
    },
    view: [],
    isNeedToReaction: false,
    isNeedToDraw: true,

    moveFront: null,
    moveBack: null,
    rotateLeft: null,
    rotateRight: null,
  };

  thisObg.view.push(thisObg.selfObj);
  // for (let i = 0; i < this.allUsersName.length; i++) {
  //   const otherPlayer = this.playerObj[this.allUsersName[i]];
  //   if (len2(otherPlayer.selfObj.info.pos, pos) < viewCoeff) {
  //     otherPlayer.view.push(thisObg.selfObj);
  //     otherPlayer.isNeedToDraw = true;

  //     thisObg.view.push(otherPlayer.selfObj);
  //     thisObg.isNeedToDraw = true;

  //     //this.playerObj[i];
  //   }
  // }
  this.playerObj[userName] = thisObg;
  return pos;
};
const update = function () {
  /* user update */
  for (let i = 0; i < this.activeUser.length; i++) {
    const player = this.playerObj[this.activeUser[i].name];

    if (player.isNeedToReaction) {
      if (player["moveFront"])
        player["moveFront"](), (player.isNeedToDraw = true);
      if (player["moveBack"])
        player["moveBack"](), (player.isNeedToDraw = true);
      if (player["rotateLeft"])
        player["rotateLeft"](), (player.isNeedToDraw = true);
      if (player["rotateRight"])
        player["rotateRight"](), (player.isNeedToDraw = true);
      // player.isNeedToDraw = true;
      //if (player.actions[j]) player.actions[j]();
    }
  }
  /* move object update */
  for (let i = 0; i < this.moveObj.length; i++) {
    const moveObj = this.moveObj[i];
    moveObj.update();
  }

  /* player to player view place update */
  for (let i = 0; i < this.allUsersName.length; i++) {
    const player = this.playerObj[this.allUsersName[i]];
    if (player.isNeedToReaction)
      for (let j = 0; j < this.allUsersName.length; j++) {
        if (i == j) continue;
        const otherPlayer = this.playerObj[this.allUsersName[j]];
        const ind = player.view.indexOf(otherPlayer.selfObj);
        if (
          len2(otherPlayer.selfObj.info.pos, player.selfObj.info.pos) <
          viewCoeff
        ) {
          player.isNeedToDraw = true;
          otherPlayer.isNeedToDraw = true;

          if (ind >= 0) continue;

          player.view.push(otherPlayer.selfObj);
          otherPlayer.view.push(player.selfObj);
        } else if (ind >= 0) {
          player.isNeedToDraw = true;
          otherPlayer.isNeedToDraw = true;

          player.view.splice(ind, 1);
          otherPlayer.view.splice(ind, 1);
        }
      }
  }

  /* player to move object view place update */
  for (let i = 0; i < this.moveObj.length; i++) {
    const moveObj = this.moveObj[i];

    for (let j = 0; j < this.allUsersName.length; j++) {
      const player = this.playerObj[this.allUsersName[j]];
      const ind = player.view.indexOf(moveObj.selfObj);
      if (len2(player.selfObj.info.pos, moveObj.selfObj.info.pos) < viewCoeff) {
        player.isNeedToDraw = true;

        if (ind >= 0) continue;

        player.view.push(moveObj.selfObj);
        moveObj.view.push(player.selfObj);
      } else if (ind >= 0) {
        player.isNeedToDraw = true;
        player.view.splice(ind, 1);
        moveObj.view.splice(ind, 1);
      }
    }
  }
  /* send draw data to player */
  for (let i = 0; i < this.activeUser.length; i++) {
    const player = this.playerObj[this.activeUser[i].name];
    if (player.isNeedToDraw) {
      console.log(this.playerObj[this.activeUser[i].name].view);
      this.activeUser[i].socket.emit(
        "sessionUpdate",
        this.playerObj[this.activeUser[i].name].view
      );
      player.isNeedToDraw = false;
    }
  }
};
const start = function () {
  this.isStarted = true;
  this.stopId = setInterval(() => this.update(), 30);
};
function create(sessionId, type) {
  sessions[sessionId] = {
    allUsersName: [],
    activeUser: [],
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
        posInMap[activeSession.type][activeSession.activeUser.length],
        user.name
      )
    );
    activeSession.allUsersName.push(user.name);
    activeSession.activeUser.push(user);
    if (activeSession.type == activeSession.activeUser.length)
      activeSession.start();
  } else if (activeSession.playerObj[user.name] != undefined) {
    user.sessionId = sessionId;
    activeSession.activeUser.push(user);
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

  const ind = activeSession.activeUser.indexOf(user);
  if (ind >= 0) {
    activeSession.playerObj[user.name]["moveFront"] = null;
    activeSession.playerObj[user.name]["moveBack"] = null;
    activeSession.playerObj[user.name]["rotateLeft"] = null;
    activeSession.playerObj[user.name]["rotateRight"] = null;
    activeSession.playerObj[user.name].isNeedToReaction = false;
    activeSession.activeUser.splice(ind, 1);
  }
}
// this.selfObj.info.scale.x * Math.sin(this.selfObj.info.angle) +
//   this.selfObj.info.scale.y * Math.cos(this.selfObj.info.angle),
function collisionCalculation(mass, otherObj) {
  const massOtherPoints = [
    {
      x:
        otherObj.info.pos.x +
        otherObj.info.scale.x * Math.sin(otherObj.info.angle) +
        otherObj.info.scale.y * Math.cos(otherObj.info.angle),
      y:
        otherObj.info.pos.y +
        otherObj.info.scale.x * Math.cos(otherObj.info.angle) +
        otherObj.info.scale.y * Math.sin(otherObj.info.angle),
    },
    {
      x:
        otherObj.info.pos.x -
        otherObj.info.scale.x * Math.sin(otherObj.info.angle) -
        otherObj.info.scale.y * Math.cos(otherObj.info.angle),
      y:
        otherObj.info.pos.y +
        otherObj.info.scale.x * Math.cos(otherObj.info.angle) +
        otherObj.info.scale.y * Math.sin(otherObj.info.angle),
    },
    {
      x:
        otherObj.info.pos.x +
        otherObj.info.scale.x * Math.sin(otherObj.info.angle) +
        otherObj.info.scale.y * Math.cos(otherObj.info.angle),
      y:
        otherObj.info.pos.y -
        otherObj.info.scale.x * Math.cos(otherObj.info.angle) -
        otherObj.info.scale.y * Math.sin(otherObj.info.angle),
    },
    {
      x:
        otherObj.info.pos.x -
        otherObj.info.scale.x * Math.sin(otherObj.info.angle) -
        otherObj.info.scale.y * Math.cos(otherObj.info.angle),
      y:
        otherObj.info.pos.y -
        otherObj.info.scale.x * Math.cos(otherObj.info.angle) -
        otherObj.info.scale.y * Math.sin(otherObj.info.angle),
    },
  ];

  for (let i = 0; i < 4; i++) {
    let tmp1 = tools.pointLocationToLine(mass[0], mass[1], massOtherPoints[i]);
    let tmp2 = tools.pointLocationToLine(mass[1], mass[2], massOtherPoints[i]);
    let tmp3 = tools.pointLocationToLine(mass[2], mass[3], massOtherPoints[i]);
    if (tmp1 > 0 && tmp2 > 0 && tmp3 > 0) return true;
  }
  return false;
}

function addAction(socket, sessionId, noofAction) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) {
    socket.emit("error", "Session id not valid", null, "home");
    return;
  }
  for (let i = 0; i < activeSession.activeUser.length; i++)
    if (activeSession.activeUser[i].socket == socket) {
      const name = activeSession.activeUser[i].name;
      let action;

      if (noofAction == "moveFront")
        action = function () {
          let flag = true;
          const newX =
              this.selfObj.info.pos.x + Math.sin(this.selfObj.info.angle),
            newY = this.selfObj.info.pos.y + Math.cos(this.selfObj.info.angle);

          for (let i = 1; i < this.view.length; i++) {
            if (this.view[i].name == "tank") {
              const maxScaleSelf =
                this.selfObj.info.scale.x * this.selfObj.info.scale.x +
                this.selfObj.info.scale.y * this.selfObj.info.scale.y;
              maxScaleOther =
                this.view[i].info.scale.x * this.view[i].info.scale.x +
                this.view[i].info.scale.y * this.view[i].info.scale.y;
              const a = Math.sqrt(
                  len2({ x: newX, y: newY }, this.view[i].info.pos)
                ),
                b = Math.sqrt(maxScaleOther) + Math.sqrt(maxScaleSelf);
              if (a < b) {
                let mass1 = tools.massToVec2(
                  tools.massFromSelfObj({ x: newX, y: newY }, this.selfObj)
                );
                let mass2 = tools.massToVec2(
                  tools.massFromSelfObj(this.view[i].info.pos, this.view[i])
                );
                if (tools.isRectangleIntersect(mass1, mass2)) {
                  flag = false;
                  break;
                }
              }
            }
          }
          if (flag) {
            this.selfObj.info.pos.x = newX;
            this.selfObj.info.pos.y = newY;
          }
        };
      else if (noofAction == "moveBack")
        action = function () {
          this.selfObj.info.pos.x -= Math.sin(this.selfObj.info.angle);
          this.selfObj.info.pos.y -= Math.cos(this.selfObj.info.angle);
        };
      else if (noofAction == "rotateRight")
        action = function () {
          this.selfObj.info.angle -= 0.089;
        };
      else if (noofAction == "rotateLeft")
        action = function () {
          this.selfObj.info.angle += 0.089;
        };

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
  for (let i = 0; i < activeSession.activeUser.length; i++)
    if (activeSession.activeUser[i].socket == socket) {
      const name = activeSession.activeUser[i].name;
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

function addBullet(socket, sessionId) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) {
    socket.emit("error", "Session id not valid", null, "home");
    return;
  }
  let thisObg = {
    selfObj: {
      name: "bullet",
      info: {
        type: "vfvf" /*"tank"*/,
        pos: null,
        angle: null,
        createdName: null,
        scale: { x: 2, y: 6 },
      },
    },
    view: [],

    update: function () {
      this.selfObj.info.pos.x += Math.sin(this.selfObj.info.angle);
      this.selfObj.info.pos.y += Math.cos(this.selfObj.info.angle);
    },
  };

  for (let i = 0; i < activeSession.activeUser.length; i++)
    if (activeSession.activeUser[i].socket == socket) {
      const createdTankInfo =
        activeSession.playerObj[activeSession.activeUser[i].name].selfObj.info;
      thisObg.selfObj.info.pos = Object.assign({}, createdTankInfo.pos);
      thisObg.selfObj.info.angle =
        activeSession.playerObj[
          activeSession.activeUser[i].name
        ].selfObj.info.angle;
      thisObg.selfObj.info.createdName = activeSession.activeUser[i].name;

      thisObg.selfObj.info.pos.x +=
        Math.sin(thisObg.selfObj.info.angle) * createdTankInfo.scale.x;
      thisObg.selfObj.info.pos.y +=
        Math.cos(thisObg.selfObj.info.angle) * createdTankInfo.scale.y;
      break;
    }

  activeSession.moveObj.push(thisObg);
}

module.exports = {
  create: create,
  addUser: addUser,
  delUser: delUser,
  addAction: addAction,
  delAction: delAction,
  addBullet: addBullet,
};
