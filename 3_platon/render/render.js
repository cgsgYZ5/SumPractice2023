import { matr } from "../math/matr.js";

import { timer } from "./timer.js";
import { camera } from "./camera.js";
import { input } from "./input/input.js";

import { prim } from "./prim.js";
import { material } from "./material/material.js";
import { ubo } from "./material/buffer.js";
import { texture } from "./material/texture.js";
import { shader } from "./material/shader.js";

import { getTextFromFile } from "../tools/textload.js";

/* Render module */
class _render {
  allPrim = [];

  allTex = [];
  allShd = [];

  gl;

  timer;
  camera;
  input;

  constructor(drawContext) {
    this.gl = drawContext.gl;

    this.camera = camera(drawContext.gl);
    this.timer = timer();
    this.input = input(drawContext.canvas);

    this.dgColorSet(1, 1, 1, 1);
  }
  dgColorSet(r, g, b, a) {
    this.gl.clearColor(r, g, b, a);
  }
  uboCreate(...arg) {
    return ubo(this.gl, ...arg);
  }
  texCreate(...arg) {
    return texture(this.gl, this.allTex, ...arg);
  }
  shdCreate(...arg) {
    return shader(this.gl, this.allShd, ...arg);
  }
  mtlCreate(...arg) {
    return material(this.gl, this.allShd, this.allTex, ...arg);
  }
  prim() {
    const pr = prim();

    this.allPrim.push(pr);

    return pr;
  }

  start() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.timer.response("fps");
  }
  end() {
    this.camera.update(this.input, this.timer);
    this.input.reset();

    this.allPrim.forEach((prim, ind) => {
      if (prim.isDraw && !prim.isDelete && prim.isCreated) {
        this.primDraw(prim);
      } else if (prim.isDelete && prim.isCreated) {
        this.allPrim.splice(ind, 1);
      }
    });
  }

  primDraw(prim) {
    /* Matr UBO */
    prim.mtl.ubo.forEach((ubo) => {
      if (ubo[0] == "primMatrix")
        ubo[1].update(
          this.gl,
          0,
          new Float32Array([
            ...matr().matrMulmatr(prim.mTrans, this.camera.matrVP).unpack(),
            ...this.camera.matrVP.unpack(),
            ...prim.mTrans.unpack(),
          ])
        );
      else if (ubo[0] == "time")
        ubo[1].update(
          this.gl,
          0,
          new Float32Array([...this.timer.allToMass()])
        );
    });
    prim.mtl.apply();

    this.gl.bindVertexArray(prim.VA);
    if (prim.IB != null) {
      prim.IB.apply(this.gl);
      this.gl.drawElements(prim.type, prim.numOfV, this.gl.UNSIGNED_SHORT, 0);
    } else this.gl.drawArrays(prim.type, 0, prim.numOfV);
  }
}

export function render(...arg) {
  return new _render(...arg);
}
