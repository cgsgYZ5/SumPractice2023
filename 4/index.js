// const http = require("http");
// const fs = require("fs").promises;

// const requestListner = (req, res) => {
//   console.log(req.url);
//   if (req.url !== "/") {
//     res.setHeader("Content-Type", "text/html");
//     res.writeHead(404);

//     res.end("Res not found");
//   }
//   if (req.url === "/main.js")
//     fs.readFile(__dirname + "/index.html").then((data) => {
//       res.setHeader("Content-Type", "aplication-json");
//       res.writeHead(200);

//       res.end(data);
//     });
//   if (req.url === "/")
//     fs.readFile(__dirname + "/index.html").then((data) => {
//       res.setHeader("Content-Type", "aplication-json");
//       res.writeHead(200);

//       res.end(data);
//     });
// };
// const server = http.createServer(requestListner);
// const host = "localhost";
// const port = 2020;
// server.listen(port, host, () => {
//   console.log(`http://${host}:${port}`);
// });

const http = require("http");
const express = require("express");
const app = express();
const morgan = require("morgan");
const WebSocket = require("ws");

const server = http.createServer(app);
const wws = new WebSocket.Server({ server });

app.use(morgan("combined"));
app.use(express.static("."));

let uniqueId = 0;
const client = [];
wws.on("onconection", (ws) => {
  console.log("Hello client");
  uniqueId++;
  client.push(ws);
  ws.send(`u id is ${uniqueId}`);
  ws.on("message", (msg) => {
    console.log("respoce from server");
    ws.send("respoce from server");
  });
});

app.get("/yap", (req, res) => {
  res.send("OAll ok!");
});

let index = 0;
app.get("/getSomeData", (req, res) => {
  index++;
  console.log(index);
  res.send(index);
});
// app.get("/", (req, res) => {
//   res.send("Hello word");
// });

const host = "localhost";
const port = 2020;
server.listen(port, host, () => {
  console.log(`http://${host}:${port}`);
});
