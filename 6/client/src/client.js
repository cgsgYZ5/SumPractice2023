/* eslint-disable no-unused-vars */
import { io } from "socket.io-client";
import Cookies from "js-cookie";

const name = Cookies.get("name");
function logOut(status) {
  if (status) socket.disconnect();
  Cookies.remove("name");
  location.assign("./index.html");
}

const socket = io();
async function socketInit() {
  socket.on("connect", () => {
    console.log(socket.id);
  });
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
  socket.emit("userConnect", name);
}

if (name == undefined) {
  logOut(false);
} else socketInit();

let logOutButton = document.getElementById("logOutButton");
logOutButton.addEventListener("click", () => {
  logOut(true);
});

document.getElementById("selfName").innerText = name;

let onlainUsers = [];
const onlainUsersText = document.getElementById("onlainUsersText");
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
const onlainUsersButton = document.getElementById("onlainUsersButton");
onlainUsersButton.addEventListener("click", () => {
  const context = document.getElementById("onlainUsersText");
  context.style.display = "block";
});
