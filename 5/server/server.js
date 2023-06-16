/* eslint-disable no-undef */
const users = require("./users.js");
/* eslint-disable no-undef */
const http = require("http");

const express = require("express");
const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const morgan = require("morgan");
const cookieParser = require("cookie-parser");

app.use(morgan("combined"));

app.use(express.json());
app.use(cookieParser());

app.use("/function", require("./route.js"));
app.use("/", express.static("../client/html"));

const activeClients = [];
io.on("connection", (socket, id) => {
  activeClients.push(socket);
  socket.on("GetUserName", async (id) => {
    let user = await users.find(undefined, id);
    activeClients.push(user);
    client.emit("UserName", user.name);
  });
  socket.on("Update", (msg) => {
    const replyMsg = `Message from client: ${socket.id} is ${msg}`;
    console.log(replyMsg);
    for (client of activeClients) {
      if (client === socket) {
        continue;
      }
      client.emit("MessageFromServer", replyMsg);
    }
  });
  console.log(`Client connected with id: ${socket.id}`);
  socket.on("MessageToServer", (msg) => {
    const replyMsg = `Message from client: ${socket.id} is ${msg}`;
    console.log(replyMsg);
    for (client of activeClients) {
      if (client === socket) {
        continue;
      }
      client.emit("MessageFromServer", replyMsg);
    }
  });
  socket.on("disconnect", () => {
    console.log(`Client disconnected with id: ${socket.id}`);
    const index = activeClients.indexOf(socket);
    if (index > -1) {
      activeClients.splice(index, 1);
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
