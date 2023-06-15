/* eslint-disable no-undef */
const user = require("./user.js");
/* eslint-disable no-undef */
const http = require("http");
const express = require("express");
const morgan = require("morgan");
const { Server } = require("socket.io");

const filename = "Z://SumPractice2023/5/dist/nolog";

const app = express();
app.use(morgan("combined"));
app.use(express.static(filename));

//initialize a simple http server
const server = http.createServer(app);
const io = new Server(server);

const clients = [];

io.on("connection", (socket) => {
  clients.push(socket);
  console.log(`Client connected with id: ${socket.id}`);
  socket.on("MessageToServer", (msg) => {
    const replyMsg = `Message from client: ${socket.id} is ${msg}`;
    console.log(replyMsg);
    for (client of clients) {
      if (client === socket) {
        continue;
      }
      client.emit("MessageFromServer", replyMsg);
    }
  });
  socket.on("disconnect", () => {
    console.log(`Client disconnected with id: ${socket.id}`);
    const index = clients.indexOf(socket);
    if (index > -1) {
      clients.splice(index, 1);
    }
  });
  socket.on("UserLogIn", (value) => {
    const logInStatus = user.logIn(value);
    if (logInStatus === null) value = "no user in base";
    else if (logInStatus === false) value = "incorrect password";
    else value = true;
    socket.emit("LoginStatus", value);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
