import { center } from "./render.js";
export let Canvas = document.getElementById("glCanvas");
const M = { x: 0, y: 0 };

export function MouseMove(e) {
  M.x = e.offsetX;
  M.y = e.offsetY;
  if (e.buttons === 1) {
    center.x -= (e.movementX / center.zoom) * 2;
    center.y += (e.movementY / center.zoom) * 2;
    // console.log(center.x, center.y);
  }
}
export function MouseWheel(event) {
  center.x -=
    (((Canvas.width / 2 - M.x) / 2) * Math.sign(event.deltaY)) / center.zoom;
  center.y +=
    (((Canvas.height / 2 - M.y) / 2) * Math.sign(event.deltaY)) / center.zoom;
  center.zoom += (center.zoom * event.deltaY) / 1000;

  event.preventDefault();
}
export function MouseInit() {
  Canvas.addEventListener("wheel", MouseWheel, false);
  Canvas.addEventListener("mousemove", MouseMove, false);
}
