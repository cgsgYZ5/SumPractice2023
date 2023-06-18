/* eslint-disable no-undef */
const clients = require("./clients.js");
/* eslint-disable no-undef */
const http = require("http");

const express = require("express");
const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const morgan = require("morgan");
//const cookieParser = require("cookie-parser");

app.use(morgan("combined"));

// app.use(express.json());
// app.use(cookieParser());

// app.use("/function", require("./route.js"));
app.use("/", express.static("../client/dest"));

io.on("connection", (socket) => {
  console.log(`Client connected with id: ${socket.id}`);

  socket.on("logIn", async (name, password) => {
    let user = await clients.find(name);
    if (user == null) socket.emit("error", "User not found");
    else if (user.password != password)
      socket.emit("error", "Password incorrect");
    else socket.emit("correctLogIn", name);
  });
  socket.on("signUp", async (name, password) => {
    let user = await clients.find(name);
    if (user != null) socket.emit("error", "User ever have registrate");
    else {
      const status = await clients.registrate(name, password);
      if (status == false) socket.emit("error", "Error process registrate");
      else socket.emit("correctSignUp", name);
    }
  });

  socket.on("userConnect", async (name) => {
    let user = await clients.find(name);
    if (user != null) {
      clients.addActiveUser(name, socket);

      clients.funcForActiveClients(
        (user, nameNewUser, socketNewUser) => {
          if (user.socket != socketNewUser)
            user.socket.emit("onlainUserUpdate-Add", nameNewUser);
        },
        name,
        socket
      );
    } else {
      socket.emit("logOut");
    }
  });
  socket.on("disconnect", () => {
    let delname = clients.delActiveUser(socket);
    if (delname != null)
      clients.funcForActiveClients((user, delname) => {
        user.socket.emit("onlainUserUpdate-Del", delname);
      }, delname[0]);
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
  // socket.on("createChat", (name) => {
  //   chats.create(name);
  // });

  // socket.on("addToChat-Server", (chatName, userName) => {
  //   chats.addUser(chatName, userName);
  // });

  // socket.on("updateChat-Server", (chatName, updateStr) => {
  //   chats.update(chatName, socket, updateStr);
  // });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
  // chats.create("General");
});

// module.exports.onlain = users.onlain;/
