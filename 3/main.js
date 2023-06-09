import { glContext } from "./gl/gl.js";
import { render } from "./render/render.js";

/* Main system module */
class _system {
  drawContext;
  render;

  constructor(id) {
    this.drawContext = glContext(id);
    this.render = render(this.drawContext);
  }
}

export function system(...arg) {
  return new _system(...arg);
}
