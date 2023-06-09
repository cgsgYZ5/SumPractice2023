export let CtrlContext = {
  x: 0,
  y: 0,
  Zoom: 1,
};
export function MouseMove(e) {
  if (e.buttons === 1) {
    const Canvas = document.getElementById("glCanvas");

    CtrlContext.x -= e.movementX / Canvas.width / CtrlContext.Zoom;
    CtrlContext.y += e.movementY / Canvas.height / CtrlContext.Zoom;
  }
}
export function MouseWheel(event) {
  CtrlContext.Zoom += (CtrlContext.Zoom * event.deltaY) / 1000;
}
export function MouseInit() {
  const Canvas = document.getElementById("glCanvas");

  Canvas.addEventListener("wheel", MouseWheel, false);
  Canvas.addEventListener("mousemove", MouseMove, false);
}
