/* eslint-disable no-unused-vars */
import { io } from "socket.io-client";
import Cookies from "js-cookie";

function createChat(chatName, chText) {
  let button = document.createElement("button");
  let div = document.createElement("div");

  let h3 = document.createElement("h3");
  let input = document.createElement("input");
  let p = document.createElement("p");
  let text = document.createElement("p");

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

  h3.id = "chName" + chatName;
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
      let updateStr = "\n " + name + " (" + time + ") : " + event.target.value;
      socket.emit(
        "updateChat-Server",
        updateStr,
        activeChat.children[0].innerText
      );
      activeChat.children[3].innerText += updateStr;
      event.target.value = "";
    }
  };

  p.id = "place" + chatName;
  p.innerText = "Messanges:";

  text.id = "text" + chatName;
  text.innerText = chText;

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

function updateChat(updateStr, chatName) {
  document.getElementById("place" + chatName).innerText += updateStr;
}

const name = Cookies.get("name");
if (name == undefined) {
  console.log("Login do`t was");
  location.assign("./index.html");
}

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
  socket.on("addToChat-Client", (chName, chText) => {
    createChat(chName, chText);
  });
  socket.on("updateChat-User", (updateStr, chatName) => {
    let chatText = document.getElementById("text" + chatName);
    chatText.innerText += updateStr;
  });
  //socket.emit("userConnect", name);
}
socketInit();
let a = document.getElementById("logout");
a.addEventListener("click", () => {
  Cookies.remove("name");
  location.assign("./index.html");
});

document.getElementById("selfname").innerText += " " + name;
