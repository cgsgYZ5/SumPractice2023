const tools = require("./tools.js");

const viewCoeffPlayer = 30000;
const viewCoeffBullet = 10000;

const sessions = [];

const typeInfo = {
  tank: {
    def: {
      generalInfo: {
        subtupe: "def",
        pos: null,
        angle: 0,
        scale: { x: 20, y: 20 },
      },
      gameInfo: { speed: 2.5 },
    },
  },
  bullet: {
    def: {
      generalInfo: {
        subtupe: "def",
        createdName: null,
        pos: null,
        angle: 0,
        scale: { x: 2, y: 6 },
      },
      gameInfo: { speed: 1 },
    },
  },
};
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

const addPlayer = function (type, pos, userName) {
  let thisObg = {
    generalInfo: { type: "tank", userName: userName },
    gameInfo: {},
    info: {},

    view: {
      absolute: [],
      relative: [],
    },

    moveFront: null,
    moveBack: null,
    rotateLeft: null,
    rotateRight: null,

    isNeedToReaction: true,
    isNeedToDraw: true,
  };

  Object.assign(thisObg.generalInfo, typeInfo.tank[type].generalInfo);
  thisObg.generalInfo.pos = pos;
  Object.assign(thisObg.gameInfo, typeInfo.tank[type].gameInfo);
  // Object.assign(thisObg.gameInfo, thisObg.drawInfo);
  thisObg.view.absolute.push(thisObg.generalInfo);
  thisObg.view.relative.push(null);
  // for (let i = 0; i < this.allUsersName.length; i++) {
  //   const otherPlayer = this.playerObj[this.allUsersName[i]];
  //   if (len2(otherPlayer.generalInfo.pos, pos) < viewCoeffPlayer) {
  //     otherPlayer.view.push(thisObg.selfObj);
  //     otherPlayer.isNeedToDraw = true;

  //     thisObg.view.push(otherPlayer.selfObj);
  //     thisObg.isNeedToDraw = true;

  //     //this.playerObj[i];
  //   }
  // }
  this.playerObj.push(thisObg);
};
const update = function () {
  /* user update */
  for (let i = 0; i < this.activeUser.length; i++) {
    const player = this.playerObj[i];

    if (player.isNeedToReaction) {
      player.isNeedToReaction = false;
      if (player["moveFront"])
        player["moveFront"](), (player.isNeedToDraw = true);
      if (player["moveBack"])
        player["moveBack"](), (player.isNeedToDraw = true);
      if (player["rotateLeft"])
        player["rotateLeft"](), (player.isNeedToDraw = true);
      if (player["rotateRight"])
        player["rotateRight"](), (player.isNeedToDraw = true);
    }
  }
  /* move object update */
  for (let i = 0; i < this.moveObj.length; i++) {
    const moveObj = this.moveObj[i];
    moveObj.update();
  }

  /* player to player view place update */
  for (let i = 0; i < this.playerObj.length; i++) {
    const player = this.playerObj[i];
    if (player.isNeedToReaction)
      for (let j = 0; j < this.playerObj.length; j++) {
        if (i == j) continue;
        const otherPlayer = this.playerObj[j];
        const ind = player.view.absolute.indexOf(otherPlayer.generalInfo);
        if (
          len2(otherPlayer.generalInfo.pos, player.generalInfo.pos) <
          viewCoeffPlayer
        ) {
          player.isNeedToDraw = true;
          otherPlayer.isNeedToDraw = true;

          if (ind >= 0) continue;

          player.view.absolute.push(otherPlayer.generalInfo);
          player.view.relative.push(null);
          otherPlayer.view.absolute.push(otherPlayer.generalInfo);
          otherPlayer.view.relative.push(null);
        } else if (ind >= 0) {
          player.isNeedToDraw = true;
          otherPlayer.isNeedToDraw = true;

          player.view.absolute.splice(ind, 1);
          player.view.relative.splice(ind, 1);

          const ind2 = otherPlayer.view.absolute.indexOf(player.generalInfo);
          otherPlayer.view.absolute.splice(ind2, 1);
          otherPlayer.view.relative.splice(ind2, 1);
        }
      }
  }

  /* player to move object view place update */
  for (let i = 0; i < this.moveObj.length; i++) {
    const moveObj = this.moveObj[i];

    for (let j = 0; j < this.playerObj.length; j++) {
      const player = this.playerObj[j];
      const ind1 = player.view.absolute.indexOf(moveObj.generalInfo);
      if (
        len2(player.generalInfo.pos, moveObj.generalInfo.pos) < viewCoeffPlayer
      ) {
        player.isNeedToDraw = true;

        if (ind1 >= 0) continue;

        player.view.absolute.push(moveObj.generalInfo);
        player.view.relative.push(moveObj.generalInfo);
      } else if (ind1 >= 0) {
        player.isNeedToDraw = true;
        player.view.absolute.splice(ind1, 1);
        player.view.relative.splice(ind1, 1);
      }
      const ind2 = player.view.absolute.indexOf(moveObj.generalInfo);
      if (
        len2(moveObj.generalInfo.pos, player.generalInfo.pos) < viewCoeffBullet
      ) {
        if (ind2 >= 0) continue;

        moveObj.view.absolute.push(player.generalInfo);
        moveObj.view.relative.push(player.generalInfo);
      } else if (ind2 >= 0) {
        moveObj.view.absolute.splice(ind2, 1);
        moveObj.view.relative.splice(ind2, 1);
      }
    }
  }
  /* send draw data to player */
  for (let i = 0; i < this.playerObj.length; i++) {
    const player = this.playerObj[i];
    if (player.isNeedToDraw) {
      console.log(this.playerObj[i].view.absolute);
      for (let j = 0; j < this.activeUser.length; j++)
        if (this.activeUser[j].name == player.generalInfo.userName) {
          this.activeUser[j].socket.emit(
            "sessionUpdate",
            this.playerObj[i].view
          );
          break;
        }
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
    type: type,

    allUsersName: [],
    activeUser: [],

    playerObj: [],
    moveObj: [], ///
    staticObj: [], ///

    delUserPlayerObj: [],

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
    activeSession.addPlayer(
      "def",
      posInMap[activeSession.type][activeSession.activeUser.length],
      user.name
    );
    user.socket.emit("gameConnect");
    activeSession.allUsersName.push(user.name);
    activeSession.activeUser.push(user);
    if (activeSession.type == activeSession.activeUser.length)
      activeSession.start();
  } else {
    for (let j = 0; j < activeSession.delUserPlayerObj.length; j++) {
      if (activeSession.delUserPlayerObj[j].generalInfo.userName == user.name) {
        user.sessionId = sessionId;
        const userObj = activeSession.delUserPlayerObj[j];

        activeSession.delUserPlayerObj.splice(j, 1);
        activeSession.playerObj.splice(
          activeSession.playerObj.length + j - 1,
          1
        );

        activeSession.playerObj.splice(
          activeSession.activeUser.length,
          0,
          userObj
        );

        activeSession.activeUser.push(user);
        userObj.isNeedToDraw = true;
        user.socket.emit("gameConnect", userObj.generalInfo.pos);
      }
    }
  }
}
function delUser(user, sessionId) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) return;

  const ind = activeSession.activeUser.indexOf(user);
  if (ind >= 0) {
    activeSession.playerObj[ind]["moveFront"] = null;
    activeSession.playerObj[ind]["moveBack"] = null;
    activeSession.playerObj[ind]["rotateLeft"] = null;
    activeSession.playerObj[ind]["rotateRight"] = null;
    activeSession.playerObj[ind].isNeedToReaction = false;

    activeSession.delUserPlayerObj.push(activeSession.playerObj[ind]);
    activeSession.playerObj.push(activeSession.playerObj[ind]);
    activeSession.playerObj.splice(ind, 1);

    activeSession.activeUser.splice(ind, 1);
  }
}
// this.drawInfo.scale.x * Math.sin(this.generalInfo.angle) +
//   this.drawInfo.scale.y * Math.cos(this.generalInfo.angle),
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
      if (noofAction == "moveFront")
        action = function () {
          let flag = true;
          const newX =
              this.generalInfo.pos.x +
              Math.sin(this.generalInfo.angle) * this.gameInfo.speed,
            newY =
              this.generalInfo.pos.y +
              Math.cos(this.generalInfo.angle) * this.gameInfo.speed;

          for (let i = 1; i < this.view.absolute.length; i++) {
            const otherDrawInfo = this.view.absolute[i];
            const maxScaleSelf =
              this.generalInfo.scale.x * this.generalInfo.scale.x +
              this.generalInfo.scale.y * this.generalInfo.scale.y;
            maxScaleOther =
              otherDrawInfo.scale.x * otherDrawInfo.scale.x +
              otherDrawInfo.scale.y * otherDrawInfo.scale.y;
            const a = Math.sqrt(len2({ x: newX, y: newY }, otherDrawInfo.pos)),
              b = Math.sqrt(maxScaleOther) + Math.sqrt(maxScaleSelf);
            if (a < b) {
              let mass1 = tools.massToVec2(
                tools.massFromSelfObj({ x: newX, y: newY }, this.generalInfo)
              );
              let mass2 = tools.massToVec2(
                tools.massFromSelfObj(otherDrawInfo.pos, otherDrawInfo)
              );
              if (tools.isRectangleIntersect(mass1, mass2)) {
                flag = false;
                break;
              }
            }
          }
          if (flag) {
            this.generalInfo.pos.x = newX;
            this.generalInfo.pos.y = newY;
            this.isNeedToReaction = true;
          }
        };
      else if (noofAction == "moveBack")
        action = function () {
          let flag = true;
          const newX =
              this.generalInfo.pos.x -
              Math.sin(this.generalInfo.angle) * this.gameInfo.speed,
            newY =
              this.generalInfo.pos.y -
              Math.cos(this.generalInfo.angle) * this.gameInfo.speed;

          for (let i = 1; i < this.view.absolute.length; i++) {
            const otherDrawInfo = this.view.absolute[i];
            const maxScaleSelf =
              this.generalInfo.scale.x * this.generalInfo.scale.x +
              this.generalInfo.scale.y * this.generalInfo.scale.y;
            maxScaleOther =
              otherDrawInfo.scale.x * otherDrawInfo.scale.x +
              otherDrawInfo.scale.y * otherDrawInfo.scale.y;
            const a = Math.sqrt(len2({ x: newX, y: newY }, otherDrawInfo.pos)),
              b = Math.sqrt(maxScaleOther) + Math.sqrt(maxScaleSelf);
            if (a < b) {
              let mass1 = tools.massToVec2(
                tools.massFromSelfObj({ x: newX, y: newY }, this.selfObj)
              );
              let mass2 = tools.massToVec2(
                tools.massFromSelfObj(otherDrawInfo.pos, otherDrawInfo)
              );
              if (tools.isRectangleIntersect(mass1, mass2)) {
                flag = false;
                break;
              }
            }
          }
          if (flag) {
            this.generalInfo.pos.x = newX;
            this.generalInfo.pos.y = newY;
            this.isNeedToReaction = true;
          }
        };
      else if (noofAction == "rotateRight")
        action = function () {
          this.isNeedToReaction = true;
          this.generalInfo.angle -= 0.089;
        };
      else if (noofAction == "rotateLeft")
        action = function () {
          this.isNeedToReaction = true;
          this.generalInfo.angle += 0.089;
        };

      activeSession.playerObj[i][noofAction] = action;
      activeSession.playerObj[i].isNeedToReaction = true;
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
      activeSession.playerObj[i][noofAction] = null;
      if (
        !activeSession.playerObj[i]["moveFront"] &&
        !activeSession.playerObj[i]["moveBack"] &&
        !activeSession.playerObj[i]["rotateLeft"] &&
        !activeSession.playerObj[i]["rotateRight"]
      )
        activeSession.playerObj[i].isNeedToReaction = false;
      return;
    }
}

function addBullet(socket, sessionId, type) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) {
    socket.emit("error", "Session id not valid", null, "home");
    return;
  }
  for (let i = 0; i < activeSession.activeUser.length; i++)
    if (activeSession.activeUser[i].socket == socket) {
      let thisObg = {
        generalInfo: { type: "bullet" },
        gameInfo: {},
        view: {
          absolute: [],
          relative: [],
        },

        update: function () {
          this.generalInfo.pos.x += Math.sin(this.generalInfo.angle);
          this.generalInfo.pos.y += Math.cos(this.generalInfo.angle);

          let flag = true;
          const newX =
              this.generalInfo.pos.x +
              Math.sin(this.generalInfo.angle) * this.gameInfo.speed,
            newY =
              this.generalInfo.pos.y +
              Math.cos(this.generalInfo.angle) * this.gameInfo.speed;

          for (let i = 1; i < this.view.absolute.length; i++) {
            const otherDrawInfo = this.view.absolute[i];
            const maxScaleSelf =
              this.generalInfo.scale.x * this.generalInfo.scale.x +
              this.generalInfo.scale.y * this.generalInfo.scale.y;
            maxScaleOther =
              otherDrawInfo.scale.x * otherDrawInfo.scale.x +
              otherDrawInfo.scale.y * otherDrawInfo.scale.y;
            const a = Math.sqrt(len2({ x: newX, y: newY }, otherDrawInfo.pos)),
              b = Math.sqrt(maxScaleOther) + Math.sqrt(maxScaleSelf);
            if (a < b) {
              let mass1 = tools.massToVec2(
                tools.massFromSelfObj({ x: newX, y: newY }, this.selfObj)
              );
              let mass2 = tools.massToVec2(
                tools.massFromSelfObj(otherDrawInfo.pos, otherDrawInfo)
              );
              if (tools.isRectangleIntersect(mass1, mass2)) {
                flag = false;
                break;
              }
            }
          }
          if (flag) {
            this.generalInfo.pos.x = newX;
            this.generalInfo.pos.y = newY;
          }
        },
      };

      Object.assign(thisObg.generalInfo, typeInfo.bullet[type].generalInfo);
      Object.assign(thisObg.gameInfo, typeInfo.bullet[type].gameInfo);

      const createdTankInfo = activeSession.playerObj[i].generalInfo;

      thisObg.generalInfo.pos = Object.assign({}, createdTankInfo.pos);
      thisObg.generalInfo.angle = createdTankInfo.angle;
      thisObg.generalInfo.createdName = activeSession.activeUser[i].name;

      thisObg.generalInfo.pos.x +=
        Math.sin(thisObg.generalInfo.angle) * createdTankInfo.scale.x;
      thisObg.generalInfo.pos.y +=
        Math.cos(thisObg.generalInfo.angle) * createdTankInfo.scale.y;

      activeSession.moveObj.push(thisObg);
      break;
    }
}

module.exports = {
  create: create,
  addUser: addUser,
  delUser: delUser,
  addAction: addAction,
  delAction: delAction,
  addBullet: addBullet,
};
