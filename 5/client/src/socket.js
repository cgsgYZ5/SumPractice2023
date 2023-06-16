/* eslint-disable no-unused-vars */
import { io } from "socket.io-client";

export async function socketInit(id) {
  const socket = io();

  socket.emit("connection", JSON.parse(id));
  socket.emit("GetUserName", JSON.parse(id));
  // client-side
  socket.on("connect", () => {
    console.log(socket.id);
  });

  socket.on("disconnect", () => {
    console.log(socket.id);
  });

  socket.on("UserName", (name) => {
    document.getElementById("selfname").innerText += name;
  });

  // document.getElementById("id1").onkeyup = (ev) => {
  //   if (ev.code === "Enter") {
  //     const value = document.getElementById("id1").value;
  //     console.log(value);
  //     document.getElementById("id1").value = "";

  //     socket.emit("MessageToServer", value);
  //   }
  // };
}
if (document.cookie == null) {
  console.log("Login do`t was");
  location.assign("./userHomePage.html");
}
socketInit(document.cookie);
window.addEventListener("load", (event) => {});
