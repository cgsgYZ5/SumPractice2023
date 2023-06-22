/* eslint-disable no-unused-vars */

import { error, goHome } from "./tools/tools.js";

import { initGl, drawAll, createTank, createBullet } from "./game/anim.js";
import Cookies from "js-cookie";
import { io } from "socket.io-client";

let name, gameId;

/* socket */
const socket = io();
async function socketInit() {
  socket.on("connection", () => {
    console.log(socket.id);
  });
  socket.on("error", (...err) => error(...err));
  socket.on("gameConnect", () => {
    console.log(socket.id);
    createTank();
    createBullet();
    //new createTank(pos);
  });
  socket.on("sessionUpdate", (...args) => drawAll(...args));

  socket.emit("userConnect", name, gameId);
}

function initUser() {
  gameId = Cookies.get("gameInfo");
  name = Cookies.get("name");
  if (name == undefined) error("Game ID undefined", "../index.html", "logout");
  if (gameId == undefined) error("Game ID undefined", "../index.html", "home");
}
const keys = {};
const keyDown = (e) => {
  if (e.code == "Space" && !keys[e.code]) socket.emit("sessionShot", gameId);

  if (e.code == "KeyW" && !keys[e.code])
    socket.emit("sessionBeginMoveFront", gameId);

  if (e.code == "KeyS" && !keys[e.code])
    socket.emit("sessionBeginMoveBack", gameId);

  if (e.code == "KeyD" && !keys[e.code])
    socket.emit("sessionBeginRotateLeft", gameId);

  if (e.code == "KeyA" && !keys[e.code])
    socket.emit("sessionBeginRotateRight", gameId);

  keys[e.code] = true;
};

const keyUp = (e) => {
  if (e.code == "KeyW" && keys[e.code])
    socket.emit("sessionStopMoveFront", gameId);

  if (e.code == "KeyS" && keys[e.code])
    socket.emit("sessionStopMoveBack", gameId);

  if (e.code == "KeyD" && keys[e.code])
    socket.emit("sessionStopRotateLeft", gameId);

  if (e.code == "KeyA" && keys[e.code])
    socket.emit("sessionStopRotateRight", gameId);

  keys[e.code] = false;
};

window.addEventListener("load", async () => {
  console.log(`aaaaa ${name}`);
  initUser();
  console.log(`aaaaa ${name} ${gameId}`);
  initGl();
  await socketInit();
  window.addEventListener("keydown", keyDown, false);
  window.addEventListener("keyup", keyUp, false);
});
