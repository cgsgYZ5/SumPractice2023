const http = require("http");
const express = require("express");
const morgan = require("morgan");
const WebSocket = require("ws");

const app = express();
app.use(morgan("combined"));
app.use(express.static("."));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("received: %s", message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  ws.send("Hi there, I am a WebSocket server");
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
