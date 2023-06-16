/* eslint-disable no-undef */
const user = require("./user.js");
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
io.on("connection", (socket) => {
  activeClients.push(socket);
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
  socket.on("UserLogIn", async (value) => {
    const logInStatus = await user.logIn(value);
    if (logInStatus === null) value = "no user in base";
    else if (logInStatus === false) value = "incorrect password";
    else value = true;
    socket.emit("LoginStatus", value);
  });
  socket.on("UserSignUp", async (value) => {
    const logInStatus = await user.signUp(value);
    if (logInStatus != false) value = logInStatus;
    else value = "error";
    socket.emit("SignUpStatus", value);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
