const http = require("http");
const host = "localhost";
const port = 8001;
const fs = require("fs").promises;

const requestListener = (req, res) => {
  res.writeHead(200);
  res.end("My first server!");
};

// const requestListener = function (req, res) {
//   res.setHeader("Content-Type", "application/json");
//   res.writeHead(200);
//   res.end(`{"message": "This is a JSON response"}`);
// };

// const requestListener = function (req, res) {
//   res.setHeader("Content-Type", "text/html");
//   res.writeHead(200);
//   res.end(`<html><body><h1>This is HTML</h1></body></html>`);
// };

// const requestListener = async function (req, res) {
//   const contents = await fs.readFile(__dirname + "/index.html");
//   res.setHeader("Content-Type", "text/html");
//   res.writeHead(200);
//   res.end(contents);
// };

// const requestListener = async (req, res) => {
//   console.log(req.url);
//   if (req.url !== "/") {
//     res.setHeader("Content-Type", "text/javascript");
//     const contents = await fs.readFile(__dirname + req.url);
//     res.writeHead(200);
//     res.end(contents);
//     return;
//   }
//   const contents = await fs.readFile(__dirname + "/index.html");
//   res.setHeader("Content-Type", "text/html");
//   res.writeHead(200);
//   res.end(contents);
// };

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
