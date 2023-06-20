/* eslint-disable no-unused-vars */
import { io } from "socket.io-client";
import Cookies from "js-cookie";

window.addEventListener("load", () => {
  const name = document.querySelector("#name");
  const password = document.querySelector("#password");
  const error = document.getElementById("textErrorMessange");

  const socket = io();
  async function socketInit() {
    socket.on("connection", () => {});
    socket.on("correctLogIn", (name) => {
      Cookies.set("name", name);
      location.assign("../homePage/homePage.html");
    });
    socket.on("error", (err) => {
      error.innerText = err;
    });
  }
  socketInit();
  document.getElementById("button").addEventListener("click", async () => {
    socket.emit("logIn", name.value, password.value);
  });
});
