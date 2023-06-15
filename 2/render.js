import { Time } from "./main.js";
import { Canvas } from "./mouse.js";

export let center = { x: Canvas.width / 2, y: Canvas.height / 2, zoom: 1 };

const form = document.querySelector("form");
let a;
form.addEventListener(
  "submit",
  (event) => {
    const data = new FormData(form);
    for (const entry of data) {
      a = entry[1];
    }
    event.preventDefault();
  },
  false
);

export function Render(gl, program, posLoc) {
  gl.clearColor(1, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (program != undefined && posLoc != undefined) {
    let loc;

    gl.enableVertexAttribArray(posLoc);

    gl.useProgram(program);

    loc = gl.getUniformLocation(program, "Time");
    gl.uniform1f(loc, Time.localTime);

    // const k = 2;
    // const vecMd = [center.x * k, center.y * k];
    // loc = gl.getUniformLocation(program, "Md");
    // gl.uniform2fv(loc, vecMd);

    loc = gl.getUniformLocation(program, "ch");
    if (a == "mond") gl.uniform1f(loc, 0);
    else if (a == "Jul") gl.uniform1f(loc, 1);
    else gl.uniform1f(loc, -1);

    loc = gl.getUniformLocation(program, "Zoom");
    gl.uniform1f(loc, center.zoom);

    loc = gl.getUniformLocation(program, "center");
    gl.uniform2fv(loc, [
      center.x / Canvas.width - 0.5,
      center.y / Canvas.height - 0.5,
    ]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
