/* eslint-disable no-unused-vars */
// import { io } from "socket.io-client";

// const socket = io();
// async function socketInit() {
//   socket.on("connect", () => {
//     console.log(socket.id);
//     socket.emit("userConnect", user.name);
//   });
//   socket.on("disconnect", () => {
//     console.log(socket.id);
//     socket.emit("userDisconnect", user.name);
//   });
//   socket.on("addToChat-Client", (chName, chText) => {
//     createChat(chName, chText);
//   });
// }
// socketInit();
import Cookies from "js-cookie";

const name = document.querySelector("#name");
const password = document.querySelector("#password");
document.getElementById("button").addEventListener("click", async () => {
  try {
    const res = await fetch("/function/logIn", {
      method: "POST",
      body: JSON.stringify({
        name: name.value,
        password: password.value,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.status == 401 || res.status == 400) throw data.messange;
    Cookies.set("name", name.value);
    location.assign("../userHomePage.html");
  } catch (err) {
    console.log(err);
  }
});
