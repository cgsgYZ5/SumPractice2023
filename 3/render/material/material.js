import { shader } from "./shader.js";
import { ubo } from "./buffer.js";
import { texture } from "./texture.js";

const defTexFlagShdName = "isTex";
const uboMtlName = "primMaterial";
const uboPrimName = "primMatrix";

/* GL module */
class _material {
  gl;

  isCreate = false;
  tex = [];
  shd;
  ubo = [];

  vertData = [];
  allVertDataSize = 0;

  constructor(
    gl,
    allShd,
    allTex,
    shdPass,
    vertData,
    mtlData,
    texData,
    userUbo = null
  ) {
    this.isCreate = true;
    this.gl = gl;

    /* shader load */
    if (typeof shdPass == "string") {
      this.shd = shader(gl, allShd, shdPass);
    } else if (typeof shdPass == "object") {
      this.shd = shdPass;
    } else {
      this.isCreate = false;
      this.shd = null;
    }

    /* Save vertex formar */
    if (vertData != null && vertData != undefined) {
      for (let i = 0; i < vertData.length - 1; i++) {
        if (
          vertData.at(-1)[vertData[i]] != undefined &&
          vertData.at(-1)[vertData[i]] != null
        ) {
          this.vertData.push([vertData[i], vertData.at(-1)[vertData[i]]]);
          this.allVertDataSize += vertData.at(-1)[vertData[i]];
        }
      }
      if (this.allVertDataSize == 0) {
        this.isCreate = false;
        this.vertData = null;
      }
    } else {
      this.isCreate = false;
      this.vertData = null;
    }

    /* load textures */
    if (texData != null && texData != undefined) {
      for (let i = 0; i < texData.length - 1; i++) {
        if (
          texData.at(-1)[texData[i]] != undefined &&
          texData.at(-1)[texData[i]] != null
        ) {
          let texMass = [texData[i]];
          let tmp = texData.at(-1)[texData[i]];
          if (typeof tmp == "string") {
            texMass.push(texture(gl, allTex, tmp));
          } else texMass.push(tmp);
          this.tex.push(texMass);
        } else console.log("no have tex in tex mass");
      }
    }

    this.ubo.push([uboPrimName, ubo(gl, 48, 0)]);

    if (userUbo != null && userUbo != undefined) {
      for (let i = 0; i < userUbo.length - 1; i++) {
        if (
          userUbo.at(-1)[userUbo[i]] != undefined &&
          userUbo.at(-1)[userUbo[i]] != null
        ) {
          this.ubo.push([userUbo[i], userUbo.at(-1)[userUbo[i]]]);
        }
      }
    }

    const loadMtlUbo = () => {
      if (this.shd.info.uniformBlocks[uboMtlName] == undefined) return;

      /* material ubo create */
      let mtlMas = [],
        texindex = [],
        texCh = 0;

      for (
        let i = 0;
        i < this.shd.info.uniformBlocks[uboMtlName].uniforms.length;
        i++
      ) {
        let uniform = this.shd.info.uniformBlocks[uboMtlName].uniforms[i];
        if (mtlData != null)
          for (let j = 0; j < mtlData.length; j++)
            if (mtlData[j] === uniform.name) {
              if (typeof mtlData.at(-1)[uniform.name] == "object")
                mtlMas.push(...mtlData.at(-1)[uniform.name]);
              else mtlMas.push(mtlData.at(-1)[uniform.name]);
              uniform = null;
              break;
            }
        if (uniform == null) continue;
        for (let j = texCh; j < this.tex.length; j++) {
          if (uniform.name == defTexFlagShdName + j) {
            mtlMas.push(this.tex[j][1].isLoad);
            texindex.push([i, j]);
            texCh++;
            uniform = null;
            break;
          }
        }
        if (uniform != null) {
          if (uniform.type == gl.FLOAT_VEC3 || uniform.type == gl.INT_VEC3)
            for (let j = 0; j < 3; j++) mtlMas.push(-1);
          else if (uniform.type == gl.FLOAT || uniform.type == gl.INT)
            mtlMas.push(-1);
        }
      }
      if (mtlMas != undefined) {
        for (let i = 0; i != mtlMas.length % 16; ) mtlMas.push(-1);

        let mtlUbo = ubo(gl, new Float32Array(mtlMas), 1);
        this.ubo.push([uboMtlName, mtlUbo]);

        for (let i = 0; i < texindex.length; i++)
          this.tex[texindex[i][1]][1].texFlagUpdate(
            gl,
            mtlUbo,
            this.shd.info.uniformBlocks[uboMtlName].uOffset[texindex[i][0]]
          );
      }
    };

    if (!this.isCreate) console.log("materia is not created");
    else {
      if (this.shd.isLoad && this.shd.isCreate) {
        loadMtlUbo();
      } else if (this.shd.isLoad && !this.shd.isCreate) {
        this.isCreate = false;
        console.log("materia is not created");
      } else {
        this.shd.program.then(() => loadMtlUbo());
        this.shd.program.catch(() => {
          this.isCreate = false;
          console.log("materia is not created");
        });
      }
    }
  }
  apply() {
    if (!this.isCreate) return;

    this.shd.apply(this.gl);

    for (let i = 0; i < this.ubo.length; i++) {
      if (this.shd.info.uniformBlocks[this.ubo[i][0]] != undefined)
        this.ubo[i][1].apply(
          this.gl,
          this.shd.program,
          this.shd.info.uniformBlocks[this.ubo[i][0]].index
        );
    }

    for (let i = 0; i < this.tex.length / 2; i++)
      if (this.shd.info.uniforms[this.tex[i][0]] != undefined)
        this.tex[i][1].apply(
          this.gl,
          i,
          this.shd.info.uniforms[this.tex[i][0]].loc
        );
  }
}

export function material(...arg) {
  return new _material(...arg);
}
