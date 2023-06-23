const tools = require("./tools.js");

const viewCoeffPlayer = 30000;
const viewCoeffBullet = 1000;

const sessions = [];

const typeInfo = {
  tank: {
    def: {
      generalInfo: {
        subtupe: "def",
        pos: null, //
        angle: 0, //
        scale: { x: 30, y: 30 }, //
        state: "alive",
        HP: 100,
      },
      gameInfo: { speed: 2.5 },
    },
  },
  bullet: {
    def: {
      generalInfo: {
        subtupe: "def",

        pos: null,
        angle: 0,
        scale: { x: 2, y: 6 },
      },
      gameInfo: { speed: 3.5, createdName: null, DMG: 10 },
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
      gameInfo: [],

      allInfo: [],
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
  // thisObg.view.absolute.push(thisObg.generalInfo);
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

function getCollision(newX, newY, thisObj, continueFunc = null) {
  const intersection = [];
  for (let i = 0; i < thisObj.view.absolute.length; i++) {
    if (continueFunc != null)
      if (continueFunc(thisObj, thisObj.view.allInfo[i])) continue;

    const otherDrawInfo = thisObj.view.absolute[i];

    const maxScaleSelf =
        thisObj.generalInfo.scale.x * thisObj.generalInfo.scale.x +
        thisObj.generalInfo.scale.y * thisObj.generalInfo.scale.y,
      maxScaleOther =
        otherDrawInfo.scale.x * otherDrawInfo.scale.x +
        otherDrawInfo.scale.y * otherDrawInfo.scale.y;
    const a = Math.sqrt(len2({ x: newX, y: newY }, otherDrawInfo.pos)),
      b = Math.sqrt(maxScaleOther) + Math.sqrt(maxScaleSelf);
    if (a < b) {
      let mass1 = tools.massToVec2(
        tools.massFromSelfObj({ x: newX, y: newY }, thisObj.generalInfo)
      );
      let mass2 = tools.massToVec2(
        tools.massFromSelfObj(otherDrawInfo.pos, otherDrawInfo)
      );
      if (tools.isRectangleIntersect(mass1, mass2)) {
        intersection.push(thisObj.view.allInfo[i]);
      }
    }
  }
  return intersection;
}

const delObj = function (obj) {
  for (let i = 0; i < this.playerObj.length; i++) {
    const ind = this.playerObj[i].view.absolute.indexOf(obj.generalInfo);
    if (ind >= 0) {
      this.playerObj[i].view.absolute.splice(ind, 1);
      this.playerObj[i].view.relative.splice(ind, 1);
      this.playerObj[i].view.allInfo.splice(ind, 1);
      this.playerObj[i].isNeedToDraw = true;
    }
  }
  for (let i = 0; i < this.moveObj.length; i++) {
    const ind = this.moveObj[i].view.absolute.indexOf(obj.generalInfo);
    if (ind >= 0) {
      this.moveObj[i].view.absolute.splice(ind, 1);
      this.moveObj[i].view.relative.splice(ind, 1);
      this.moveObj[i].view.allInfo.splice(ind, 1);
    }
  }
  const ind = this.moveObj.indexOf(obj);
  if (ind >= 0) this.moveObj.splice(ind, 1);
};
const update = function () {
  /* user update */
  for (let i = 0; i < this.activeUser.length; i++) {
    const player = this.playerObj[i];

    if (player["moveFront"])
      player["moveFront"](), (player.isNeedToDraw = true);
    if (player["moveBack"]) player["moveBack"](), (player.isNeedToDraw = true);
    if (player["rotateLeft"])
      player["rotateLeft"](), (player.isNeedToDraw = true);
    if (player["rotateRight"])
      player["rotateRight"](), (player.isNeedToDraw = true);
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

          if (ind < 0) {
            player.view.absolute.push(otherPlayer.generalInfo);
            player.view.relative.push(null);
            player.view.gameInfo.push(otherPlayer.gameInfo);

            player.view.allInfo.push(otherPlayer);

            otherPlayer.view.absolute.push(player.generalInfo);
            otherPlayer.view.relative.push(null);
            otherPlayer.view.gameInfo.push(player.gameInfo);
            otherPlayer.view.allInfo.push(player);
          }
        } else if (ind >= 0) {
          player.isNeedToDraw = true;
          otherPlayer.isNeedToDraw = true;

          player.view.absolute.splice(ind, 1);
          player.view.relative.splice(ind, 1);
          player.view.gameInfo.splice(ind, 1);
          player.view.allInfo.splice(ind, 1);

          const ind2 = otherPlayer.view.absolute.indexOf(player.generalInfo);
          otherPlayer.view.absolute.splice(ind2, 1);
          otherPlayer.view.relative.splice(ind2, 1);
          otherPlayer.view.gameInfo.splice(ind2, 1);

          otherPlayer.view.allInfo.splice(ind2, 1);
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

        if (ind1 < 0) {
          player.view.absolute.push(moveObj.generalInfo);
          player.view.relative.push(null);
          player.view.gameInfo.push(moveObj.gameInfo);
          player.view.allInfo.push(moveObj);
        }
      } else if (ind1 >= 0) {
        player.isNeedToDraw = true;
        player.view.absolute.splice(ind1, 1);
        player.view.relative.splice(ind1, 1);
        player.view.gameInfo.splice(ind1, 1);

        player.view.allInfo.splice(ind1, 1);
      }
      const ind2 = moveObj.view.absolute.indexOf(player.generalInfo);
      if (
        len2(moveObj.generalInfo.pos, player.generalInfo.pos) < viewCoeffBullet
      ) {
        if (ind2 < 0) {
          moveObj.view.absolute.push(player.generalInfo);
          moveObj.view.relative.push(null);
          moveObj.view.allInfo.push(player);
        }
      } else if (ind2 >= 0) {
        moveObj.view.absolute.splice(ind2, 1);
        moveObj.view.relative.splice(ind2, 1);
        moveObj.view.allInfo.splice(ind2, 1);
      }
    }
  }
  /* send draw data to player */
  for (let i = 0; i < this.playerObj.length; i++) {
    const player = this.playerObj[i];
    if (player.isNeedToDraw) {
      for (let j = 0; j < this.activeUser.length; j++)
        if (this.activeUser[j].name == player.generalInfo.userName) {
          this.activeUser[j].socket.emit(
            "sessionUpdate",
            {
              absolute: this.playerObj[i].view.absolute,
              relative: this.playerObj[i].view.relative,
            },
            this.playerObj[i].generalInfo
          );
          break;
        }
      player.isNeedToDraw = false;
      player.isNeedToReaction = false;
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
    delObj: delObj,

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

function addAction(socket, sessionId, noofAction) {
  const activeSession = sessions[sessionId];
  if (activeSession == undefined) {
    socket.emit("error", "Session id not valid", null, "home");
    return;
  }
  for (let i = 0; i < activeSession.activeUser.length; i++)
    if (activeSession.activeUser[i].socket == socket) {
      let action;
      if (noofAction == "moveFront")
        action = function () {
          const newX =
              this.generalInfo.pos.x +
              Math.sin(this.generalInfo.angle) * this.gameInfo.speed,
            newY =
              this.generalInfo.pos.y +
              Math.cos(this.generalInfo.angle) * this.gameInfo.speed;
          let intersection = getCollision(newX, newY, this);
          if (intersection.length == 0) {
            this.generalInfo.pos.x = newX;
            this.generalInfo.pos.y = newY;
            this.isNeedToReaction = true;
          }
        };
      else if (noofAction == "moveBack")
        action = function () {
          const newX =
              this.generalInfo.pos.x -
              Math.sin(this.generalInfo.angle) * this.gameInfo.speed,
            newY =
              this.generalInfo.pos.y -
              Math.cos(this.generalInfo.angle) * this.gameInfo.speed;

          let intersection = getCollision(newX, newY, this);

          if (intersection.length == 0) {
            this.generalInfo.pos.x = newX;
            this.generalInfo.pos.y = newY;
            this.isNeedToReaction = true;
          }
        };
      else if (noofAction == "rotateRight")
        action = function () {
          const savedAngle = this.generalInfo.angle;
          this.generalInfo.angle -= 0.089;

          let intersection = getCollision(
            this.generalInfo.pos.x,
            this.generalInfo.pos.y,
            this
          );

          if (intersection.length == 0) {
            this.isNeedToReaction = true;
          } else this.generalInfo.angle = savedAngle;
        };
      else if (noofAction == "rotateLeft")
        action = function () {
          const savedAngle = this.generalInfo.angle;
          this.generalInfo.angle += 0.089;

          let intersection = getCollision(
            this.generalInfo.pos.x,
            this.generalInfo.pos.y,
            this
          );

          if (intersection.length == 0) {
            this.isNeedToReaction = true;
          } else this.generalInfo.angle = savedAngle;
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
          allInfo: [],
        },
        creator: null,

        update: function () {
          // this.generalInfo.pos.x += Math.sin(this.generalInfo.angle);
          // this.generalInfo.pos.y += Math.cos(this.generalInfo.angle);

          const newX =
              this.generalInfo.pos.x +
              Math.sin(this.generalInfo.angle) * this.gameInfo.speed,
            newY =
              this.generalInfo.pos.y +
              Math.cos(this.generalInfo.angle) * this.gameInfo.speed;

          const intersection = getCollision(
            newX,
            newY,
            this,
            (thisObj, viewObj) => {
              if (thisObj.creator == viewObj) return true;
            }
          );
          if (intersection.length == 0) {
            this.generalInfo.pos.x = newX;
            this.generalInfo.pos.y = newY;
          } else {
            for (let i = 0; i < intersection.length; i++) {
              if (intersection[i].generalInfo.type == "tank") {
                intersection[i].generalInfo.HP -= this.gameInfo.DMG;
                if (intersection[i].generalInfo.HP <= 0) {
                  intersection[i].gameInfo.state = "depth";
                }
              }
              if (intersection[i].generalInfo.type == "bullet")
                intersection[i].destroy(activeSession);
            }
            this.destroy(activeSession);
          }
        },
        destroy: function (session) {
          session.delObj(this);
        },
      };

      Object.assign(thisObg.generalInfo, typeInfo.bullet[type].generalInfo);
      Object.assign(thisObg.gameInfo, typeInfo.bullet[type].gameInfo);

      const creatorTankInfo = activeSession.playerObj[i].generalInfo;

      thisObg.generalInfo.pos = Object.assign({}, creatorTankInfo.pos);
      thisObg.generalInfo.angle = creatorTankInfo.angle;
      thisObg.creator = activeSession.playerObj[i];

      thisObg.generalInfo.pos.x +=
        Math.sin(thisObg.generalInfo.angle) * creatorTankInfo.scale.x;
      thisObg.generalInfo.pos.y +=
        Math.cos(thisObg.generalInfo.angle) * creatorTankInfo.scale.y;

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
