/* eslint-disable no-unused-vars */
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import { error, logOut } from "./tools/tools.js";

/* socket */
const socket = io();
async function socketInit() {
  socket.on("connection", () => {
    console.log(socket.id);
  });
  socket.on("error", (...err) => error(...err));
  socket.on("onlainUserUpdate-All", (usersName) => {
    onlainUsers = usersName;
    onlainUsersDisplayAll();
  });
  socket.on("onlainUserUpdate-Add", (newUserName) => {
    onlainUsers.push(newUserName);
    onlainUsersAdd(newUserName);
  });
  socket.on("onlainUserUpdate-Del", (delUserName) => {
    const ind = onlainUsers.indexOf(delUserName);
    if (ind >= 0) {
      onlainUsers.splice(ind, 1);
      onlainUsersDel(delUserName);
    }
  });
  socket.on("addToAwaitRoom", (roomID) => {
    room = roomID;
    console.log(room);
  });
  socket.on("addGameRoom", (noofGame) => {
    Cookies.set("gameInfo", noofGame);
    location.assign("../game/game.html");
  });
  socket.emit("userConnect", name);
}

/* user log out */
let logOutButton = document.getElementById("logOutButton");
logOutButton.addEventListener("click", () => {
  logOut(true);
});

/* other user info */
let onlainUsers = [];
const onlainUsersText = document.getElementById("onlainUsersText");
const onlainUsersButton = document.getElementById("onlainUsersButton");
function onlainUsersAdd(name) {
  const div = document.createElement("div");

  div.id = name;
  div.innerText = name;
  onlainUsersText.appendChild(div);
}
function onlainUsersDel(name) {
  let elment = document.getElementById(name);
  if (elment != null) onlainUsersText.removeChild(elment);
}
function onlainUsersDisplayAll() {
  while (onlainUsersText.firstChild) {
    onlainUsersText.removeChild(onlainUsersText.firstChild);
  }
  onlainUsers.forEach((user) => {
    const div = document.createElement("div");

    div.id = user;
    div.innerText = user;
    onlainUsersText.appendChild(div);
  });
}
onlainUsersButton.addEventListener("click", () => {
  const context = document.getElementById("onlainUsersText");
  context.style.display = "block";
});

/* add to await room */
let room;
const gameButton = document.getElementById("gameButton");
gameButton.addEventListener("click", () => {
  socket.emit("connectToAwaitingRoom");
});

/* user defined */
let name;
window.addEventListener("load", () => {
  name = Cookies.get("name");
  if (name == undefined) {
    logOut(false);
  } else {
    socketInit();
    document.getElementById("selfName").innerText = name;
  }
});
