import { Time } from "./main.js";
import { CtrlContext } from "./mouse.js";

export function Render(gl, program, posLoc) {
  gl.clearColor(1, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (program != undefined && posLoc != undefined) {
    let loc;

    gl.enableVertexAttribArray(posLoc);

    gl.useProgram(program);

    loc = gl.getUniformLocation(program, "Time");
    gl.uniform1f(loc, Time.localTime);

    const k = 2;
    const vecMd = [CtrlContext.x * k, CtrlContext.y * k];
    loc = gl.getUniformLocation(program, "Md");
    gl.uniform2fv(loc, vecMd);

    loc = gl.getUniformLocation(program, "Zoom");
    gl.uniform1f(loc, CtrlContext.Zoom);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
