/* eslint-disable no-unused-vars */
import { io } from "socket.io-client";

async function main() {
  const socket = io();

  // client-side
  socket.on("connect", () => {
    console.log(socket.id);
    socket.on("MessageFromServer", function (msg) {
      console.log(msg);
    });
  });

  socket.on("disconnect", () => {
    console.log(socket.id);
  });

  socket.on("LoginStatus", (value) => {
    if (value === true) {
      console.log("login status is OK");
      window.location.href = window.location.href + "/";
    } else console.log(value);
  });
  // document.getElementById("id1").onkeyup = (ev) => {
  //   if (ev.code === "Enter") {
  //     const value = document.getElementById("id1").value;
  //     console.log(value);
  //     document.getElementById("id1").value = "";

  //     socket.emit("MessageToServer", value);
  //   }
  // };
  document.getElementById("button").addEventListener("click", () => {
    const logindata = {
      name: document.getElementById("name").value,
      password: document.getElementById("password").value,
    };
    socket.emit("UserLogIn", logindata);
  });
}

window.addEventListener("load", (event) => {
  main();
});
