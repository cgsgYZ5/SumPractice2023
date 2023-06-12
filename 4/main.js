function init() {
  const socket = new WebSocket("ws://localhost:2020");

  socket.onopen = (e) => {
    console.log("Socet conected");
    socket.send("Hello?");
  };
  socket.onopen = (e) => {
    console.log("Socet conected");
  };
  socket.onerror = (e) => {
    console.log("Socet error");
  };
  socket.onmessage = (e) => {
    console.log(`Socet message ${e.data}`);
  };
}

window.addEventListener("load", () => {
  init();
  console.log("hello!");
  setInterval(async () => {
    const resp = await fetch("getSomeData");
    const data = await resp.text;
  }, 1000);
});
