import { matr } from "../math/matr.js";
import { buffer } from "./material/buffer.js";
import { getTextFromFile } from "../tools/textload.js";
import { avtoNormal } from "../tools/avtonormal.js";

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

  create(gl, type, V, I, mtl = null) {
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
        return this;
      }
    mtl.shd.program.then(() => {
      this.isCreated = true;
      this.loadV(gl, V, I, mtl);
    });
    mtl.shd.program.catch(() => {
      this.error("prim have not shader");
      return this;
    });
    return this;
  }
  loadObjFromFile(gl, filename, type, mtl) {
    return getTextFromFile(filename).then((text) => {
      this.loadObjFromText(gl, text, type, mtl);
    });
  }
  loadObjFromText(gl, text, type, mtl) {
    if (text == undefined || text == null || text == "") return;
    const data = text.replace("\r").split("\n");
    const V = [],
      I = [];
    let ilength = 0;
    for (let i = 0; i < data.length; i++) {
      if ("f " === data[i].slice(0, 2)) {
        ilength++;
      }
    }
    for (let i = 0; i < data.length; i++) {
      if ("v " === data[i].slice(0, 2)) {
        let tmp = data[i].split(" ");
        for (let j = 1; j < 4; j++) V.push(Number(tmp[j]));
      } else if ("f " === data[i].slice(0, 2)) {
        let tmp = data[i].split(" ");
        for (let j = 1; j < tmp.length; j++) {
          let ind = Number(tmp[j].split("//")[0]);
          if (ind > 0) I.push(ind - 1);
          else I.push(ilength + ind);
        }
      }
    }

    this.create(gl, type, { P: V, N: avtoNormal(V, I) }, I, mtl);
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
      ) {
        V[mtl.vertData[i][0]] = undefined;
        console.log(
          "fatall error not have" + mtl.vertData[i][0] + " in mas vert"
        );
      }

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

    if (typeof V[0] != "number") {
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
