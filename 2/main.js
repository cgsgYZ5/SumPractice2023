import { Timer } from "./timer.js";
import { LoadProgram, LoadPos } from "./shader.js";
import { Render } from "./render.js";
import { MouseInit } from "./mouse.js";

export let Time = new Timer();
/* GL module */
/** @type {WebGLRenderingContext} */
export let gl, Canvas;

export function InitGL() {
  Canvas = document.getElementById("glCanvas");
  gl = Canvas.getContext("webgl2");

  MouseInit();

  let program;
  let PosLoc;
  LoadProgram(gl, ".\\shaders\\")
    .then((prg) => {
      program = prg;
      const pos = [-1, 1, 0, 1, 3, 1, 0, 1, -1, -3, 0, 1];
      PosLoc = LoadPos(gl, program, pos);
    })
    .catch((err) => {
      console.log(err);
    });

  const updateFunc = () => {
    Time.response();
    Render(gl, program, PosLoc);
    window.requestAnimationFrame(updateFunc);
  };

  updateFunc();
  //document.addEventListener("keyup", , false);
}
