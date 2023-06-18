/* eslint-disable no-undef */
const users = require("./users.js");
const chats = require("./chat.js");

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
app.use("/", express.static("../client/html")); // <-- /logIn.html   === ../client/

io.on("connection", (socket) => {
  console.log(`Client connected with id: ${socket.id}`);

  socket.on("userConnect", async (name) => {
    let user = await users.findInBase(name);
    if (user != null) {
      users.onlain.push(users.create(name, socket));

      await chats.addUser("General", name);
    }
  });
  // socket.on("MessageToServer", (msg) => {
  //   const replyMsg = `Message from client: ${socket.id} is ${msg}`;
  //   console.log(replyMsg);
  //   for (client of users.onlain) {
  //     if (client === socket) {
  //       continue;
  //     }
  //     client.emit("MessageFromServer", replyMsg);
  //   }
  // });
  socket.on("disconnect", () => {
    console.log(`Client disconnected with id: ${socket.id}`);
    const index = users.onlain.indexOf(socket);
    if (index > -1) {
      users.onlain.splice(index, 1);
    }
  });
  socket.on("createChat", (name) => {
    chats.create(name);
  });

  socket.on("addToChat-Server", (chatName, userName) => {
    chats.addUser(chatName, userName);
  });

  socket.on("updateChat-Server", (chatName, updateStr) => {
    chats.update(chatName, socket, updateStr);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
  // chats.create("General");
});

module.exports.onlain = users.onlain;
