import { matr } from "../math/matr.js";
import { prim } from "./prim.js";
import { timer } from "./timer.js";
import { camera } from "./camera.js";
import { input } from "./input/input.js";
import { material } from "./material/material.js";

/* Render module */
class _render {
  static allPrims = [];

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

  mtlCreate(...arg) {
    return material(this.gl, ...arg);
  }

  primCreate(type, V, I, mtl) {
    const pr = prim(this.gl, type, V, I, mtl);

    _render.allPrims.push(pr);

    return pr;
  }
  dgColorSet(r, g, b, a) {
    this.gl.clearColor(r, g, b, a);
  }
  start() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.timer.response("fps");
  }

  primDraw(prim) {
    prim.mtl.apply(this.camera, this.timer);

    /* Matr UBO */
    prim.mtl.ubo[0].update(
      this.gl,
      new Float32Array([
        ...matr().matrMulmatr(prim.mTrans, this.camera.matrVP).unpack(),
        ...this.camera.matrVP.unpack(),
        ...prim.mTrans.unpack(),
      ])
    );
    prim.mtl.ubo[0].apply(this.gl, prim.mtl.shd);

    this.gl.bindVertexArray(prim.VA);
    if (prim.IB != undefined) {
      prim.IB.apply(this.gl);
      this.gl.drawElements(prim.type, prim.numOfV, this.gl.UNSIGNED_SHORT, 0);
    } else this.gl.drawArrays(prim.type, 0, prim.numOfV);
  }
  /*
  primDrawInstace() {}
  */
  end() {
    this.camera.update(this.input, this.timer);

    _render.allPrims.forEach((prim, ind) => {
      if (
        prim.isDraw === true &&
        prim.isDelete === false &&
        prim.isCreated === true
      ) {
        //let loc;
        /* UBO and uniforms */
        this.primDraw(prim);
      } else if (prim.isDelete === true && prim.isCreated === true) {
        this.allPrims.splice(ind, 1);
      }
    });
    this.input.reset();
  }
}

export function render(...arg) {
  return new _render(...arg);
}
