/* GL module */

class _glContext {
  canvas;
  id;
  /** @type {WebGLRenderingContext} */
  gl;

  constructor(id) {
    this.id = id;
    this.canvas = document.getElementById(id);
    if (this.canvas != null) {
      this.gl = this.canvas.getContext("webgl2");
      this.gl.cullFace(this.gl.FRONT_AND_BACK);
      this.gl.enable(this.gl.DEPTH_TEST);
    } else this.gl = null;
  }
}

export function glContext(...arg) {
  return new _glContext(...arg);
}
