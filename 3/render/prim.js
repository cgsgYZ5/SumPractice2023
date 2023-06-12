import { matr } from "../math/matr.js";
import { buffer } from "./material/buffer.js";

let admisName = [];
admisName["P"] = ["in_pos", "Position"];
admisName["N"] = ["in_norm", "Normal"];
admisName["T"] = ["in_tex", "Texture"];
admisName["C"] = ["in_color", "Color"];

/* Primitive module */
class _prim {
  isCreated = false;
  isDelete = false;
  isDraw = false;

  type;
  mTrans;
  mtl;
  VA;
  VB;
  IB = null;
  numOfV;

  constructor(gl, type, V, I, mtl = null) {
    if (type == "triangle strip") this.type = gl.TRIANGLE_STRIP;
    else if (type == "triangle") this.type = gl.TRIANGLES;
    else this.type = gl.POINTS;

    this.mtl = mtl;
    if (mtl == null || !mtl.isCreate) {
      this.error("prim have not material");
      return;
    }
    if (mtl.shd.isLoad)
      if (mtl.shd.isCreate == false) {
        this.error("prim have not shader");
        return;
      } else {
        this.isCreated = true;
        this.loadV(gl, V, I, mtl);
        return;
      }
    mtl.shd.program.then(() => {
      this.isCreated = true;
      this.loadV(gl, V, I, mtl);
    });
    mtl.shd.program.catch(() => {
      this.error("prim have not shader");
      return;
    });
  }
  draw(mTrans) {
    this.isDraw = true;
    if (mTrans == undefined || mTrans == null) {
      console.assertlog("trans matrix for draw is incorrect");
      this.mTrans = matr().identity();
    } else this.mTrans = mTrans;
  }
  del() {
    this.isDelete = true;
  }
  convert(V, mtl) {
    const Vert = [];
    const massIndex = [];
    for (let i = 0; i < mtl.vertData.length; i++) massIndex.push(0);
    let n;
    for (let i = 0; i < mtl.vertData.length; i++) {
      if (V[mtl.vertData[i][0]] != undefined && V[mtl.vertData[i][0]] != null) {
        n = V[mtl.vertData[i][0]].length / mtl.vertData[i][1];
        break;
      }
    }

    for (let i = 0; i < mtl.vertData.length; i++)
      if (
        V[mtl.vertData[i][0]] == undefined ||
        V[mtl.vertData[i][0]] == null ||
        V[mtl.vertData[i][0]].length === 0
      )
        V[mtl.vertData[i][0]] = undefined;

    for (let i = 0; i < n; i++)
      for (let j = 0; j < massIndex.length; j++) {
        if (V[mtl.vertData[j][0]] == undefined) continue;
        for (let k = 0; k < mtl.vertData[j][1]; k++) {
          Vert.push(V[mtl.vertData[j][0]][massIndex[j]++]);
        }
      }

    return Vert;
  }

  loadV(gl, V = null, I = null, mtl) {
    if (I == undefined || I == null) {
      this.numOfV = V.length;
    } else this.numOfV = I.length;

    this.VA = gl.createVertexArray();
    gl.bindVertexArray(this.VA);

    if (typeof V == "object") {
      for (let i = 0; i < mtl.vertData.length; i++)
        if (
          V[mtl.vertData[i][0]] == undefined ||
          V[mtl.vertData[i][0]] == null ||
          V[mtl.vertData[i][0]].length === 0
        ) {
          console.log(`in V massive no ${mtl.vertData[i][0]}`);
          mtl.allVertDataSize -= mtl.vertData[i][1];
        }
      V = this.convert(V, mtl);
    }
    if (V != null) this.VB = buffer(gl, gl.ARRAY_BUFFER, new Float32Array(V));
    else {
      this.error("have V in prim creating");
      return;
    }

    if (I != null)
      this.IB = buffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Int16Array(I));

    let off = 0;
    for (let i = 0; i < mtl.vertData.length; i++) {
      for (let j = 0; j < admisName[mtl.vertData[i][0]].length; j++) {
        const name = admisName[mtl.vertData[i][0]][j];
        if (mtl.shd.info.attrs[name] != undefined) {
          const loc = mtl.shd.info.attrs[name].loc;
          gl.vertexAttribPointer(
            loc,
            mtl.vertData[i][1],
            gl.FLOAT,
            false,
            mtl.allVertDataSize * 4,
            off
          );
          off += mtl.vertData[i][1] * 4;
          gl.enableVertexAttribArray(loc);
          break;
        } else if (j == admisName[mtl.vertData[i][0]].length)
          console.log(
            `shader have ${mtl.vertData[i][0]} but material patern have`
          );
      }
    }
  }
  error(Buf = null) {
    this.isCreated = false;
    if (Buf != null) console.log(Buf);
  }
}

export function prim(...arg) {
  return new _prim(...arg);
}
