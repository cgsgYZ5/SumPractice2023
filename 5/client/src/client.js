/* eslint-disable no-unused-vars */
import { io } from "socket.io-client";
import Cookies from "js-cookie";

function createChat(chatName) {
  let button = document.createElement("button");
  let div = document.createElement("div");

  let h3 = document.createElement("h3");
  let input = document.createElement("input");
  let p = document.createElement("p");
  let text = document.createElement("div");

  button.className = "tablinks";
  button.onclick = function () {
    let tabcontext = document.getElementsByClassName("tabcontext");
    let chat = document.getElementById(chatName);
    let inputs = document.getElementsByClassName("inputTextToServer");
    let input = document.getElementById("input" + chatName);

    let isHide = chat.style.display == "none";

    for (let i = 0; i < tabcontext.length; i++) {
      tabcontext[i].style.display = "none";
      inputs[i].style.display = "none";
    }
    if (isHide) {
      activeChat = chat;
      chat.style.display = "block";
      input.style.display = "block";
    } else activeChat = null;
  };

  div.id = chatName;
  div.className = "tabcontext";
  div.style.display = "none";

  h3.id = "chatName" + chatName;
  h3.innerText = chatName;

  input.id = "input" + chatName;
  input.className = "inputTextToServer";
  input.style.display = "block";
  input.type = "text";
  input.onkeydown = function (event) {
    if (event.key == "Enter" && activeChat != null) {
      const date = new Date();
      let time =
        JSON.stringify(date.getHours()) +
        ":" +
        JSON.stringify(date.getMinutes()) +
        ":" +
        JSON.stringify(date.getSeconds());
      let updateStr = { name: name, time: time, messange: event.target.value };
      socket.emit(
        "updateChat-Server",
        activeChat.children[0].innerText,
        updateStr
      );
      const text = document.getElementById(
        "text" + activeChat.children[0].innerText
      );
      updateChat(text, updateStr);
      event.target.value = "";
    }
  };

  p.id = "place" + chatName;
  p.innerText = "Messanges:";

  text.id = "text" + chatName;
  text.className = "messangebox";

  let chats = document.getElementById("Chats");
  chats.appendChild(div);

  // let divContain = document.getElementById(chatName);
  div.appendChild(h3);
  div.appendChild(input);
  div.appendChild(p);
  div.appendChild(text);

  let buttons = document.getElementById("buttons");
  buttons.appendChild(button);
}

function updateChat(text, updateStr) {
  let p = document.createElement("div");
  let info = document.createElement("div");

  p.className = "msg";
  info.className = "info";
  info.innerText = updateStr.time;
  p.appendChild(info);
  if (updateStr.name == name) {
    p.innerText = "\n " + updateStr.messange + " (" + updateStr.time + ")";
    p.id = "selfUser";
  } else {
    p.id = "otherUser";
    p.innerText =
      "\n " +
      updateStr.name +
      " (" +
      updateStr.time +
      ") : " +
      updateStr.messange;
  }

  text.appendChild(p);
}

const name = Cookies.get("name");

let activeChat = null;

const socket = io();
async function socketInit() {
  socket.on("connect", () => {
    console.log(socket.id);
    socket.emit("userConnect", name);
  });
  socket.on("disconnect", () => {
    console.log(socket.id);
    socket.emit("userDisconnect", name);
  });
  socket.on("addToChat-Client", (chatName, chatMessange) => {
    createChat(chatName);
    const text = document.getElementById("text" + chatName);
    for (let i = 0; i < chatMessange.length; i++)
      updateChat(text, chatMessange[i]);
  });
  socket.on("updateChat-User", (chatName, updateStr) => {
    updateChat(chatName, updateStr);
  });
}
if (name == undefined) {
  console.log("Login do`t was");
  location.assign("./index.html");
} else socketInit();

let a = document.getElementById("logout");
a.addEventListener("click", () => {
  Cookies.remove("name");
  location.assign("./index.html");
});

document.getElementById("selfname").innerText += " " + name;
