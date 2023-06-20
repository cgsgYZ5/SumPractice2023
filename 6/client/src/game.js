/* eslint-disable no-unused-vars */

import { error, goHome } from "./tools/tools.js";

import { initGl, createTank, drawAll } from "./game/anim.js";
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
  socket.on("gameConnect", (pos) => {
    // console.log(socket.id);
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

window.addEventListener("load", () => {
  console.log(`aaaaa ${name}`);
  initUser();
  console.log(`aaaaa ${name} ${gameId}`);
  initGl();
  socketInit();
});
