import { shader } from "./shader.js";
import { ubo } from "./buffer.js";
import { texture } from "./texture.js";

const defTexFlagShdName = "isTex";
const uboMtlName = "primMaterial";
const uboPrimName = "primMatrix";

/* GL module */
class _material {
  gl;

  tex = [];
  shd;
  ubo = [];

  constructor(gl, allShd, shdPass, vertData, mtlData, texData, userUbo = null) {
    this.gl = gl;
    /* shader load */
    if (typeof shdPass == "string") {
      allShd.forEach((shd) => {
        if (shd.pass == shdPass) this.shd = shd;
      });
      if (this.shd == undefined) {
        this.shd = shader(gl, shdPass);
        allShd.push(this.shd);
      }
    } else {
      allShd.forEach((shd) => {
        if (shd == shdPass) this.shd = shd;
      });
      if (this.shd == undefined) {
        this.shd = shdPass;
        allShd.push(this.shd);
      }
    }
    /* Save vertex formar */
    this.vertData = vertData;

    /* load textures */
    if (texData != null && texData != undefined) {
      let texObj = [];

      for (let i = 0; i < texData.length - 1; i++) {
        if (
          texData.at(-1)[texData[i]] != undefined &&
          texData.at(-1)[texData[i]] != null
        ) {
          this.tex.push(texData[i]);
          let tmp = texData.at(-1)[texData[i]];
          if (typeof tmp == "string") {
            texObj[texData[i]] = texture(gl, tmp);
          } else texObj[texData[i]] = tmp;
        } else alert("no have tex in tex mass");
      }
      this.tex.push(texObj);
    } else this.tex = [];

    const loadTexAndUbo = () => {
      let mtlMas = [],
        texindex = [];

      /* material ubo create */
      if (mtlData != null && mtlData != undefined) {
        for (
          let j = 0;
          j < this.shd.info.uniformBlocks[uboMtlName].uNames.length;
          j++
        ) {
          for (
            let i = 0;
            i < mtlData.length - 1 && j < mtlData.length - 1;
            i++
          ) {
            if (
              this.shd.info.uniformBlocks[uboMtlName].uNames[j] == mtlData[i]
            ) {
              if (i != j)
                console.log("parametr of material write in other pos");
              if (
                mtlData.at(-1)[mtlData[i]] != undefined &&
                mtlData.at(-1)[mtlData[i]] != null
              ) {
                if (typeof mtlData.at(-1)[mtlData[i]] == "object")
                  mtlMas.push(...mtlData.at(-1)[mtlData[i]]);
                else mtlMas.push(mtlData.at(-1)[mtlData[i]]);
                break;
              }
            }
          }
          for (let k = 0; k < this.tex.length; k++) {
            if (
              this.shd.info.uniformBlocks[uboMtlName].uNames[j] ==
              defTexFlagShdName + k
            ) {
              if (this.tex[this.tex.length - 1][this.tex[k]] != undefined) {
                mtlMas.push(this.tex[this.tex.length - 1][this.tex[k]].isLoad);
                texindex.push(k);
              } else alert("texture num no valid");
            }
          }
        }
      }

      if (mtlMas != undefined) {
        let uboObg = this.ubo[this.ubo.length - 1];
        this.ubo[this.ubo.length - 1] = uboMtlName;
        for (let i = 0; i != mtlMas.length % 16; ) mtlMas.push(-1);

        uboObg[uboMtlName] = ubo(gl, new Float32Array(mtlMas), 1);
        this.ubo.push(uboObg);
        for (let i = 0; i < texindex.length; i++)
          this.tex[this.tex.length - 1][this.tex[i]].texFlagUpdate(
            gl,
            this.shd,
            this.shd.info.uniformBlocks[uboMtlName].uOffset[texindex[i]]
          );
      }
    };

    if (this.shd.program.then == undefined) {
      loadTexAndUbo();
    } else this.shd.program.then(() => loadTexAndUbo());

    let uboObg = {};
    this.ubo.push(uboPrimName);
    uboObg[uboPrimName] = ubo(gl, 48, 0);

    if (userUbo != null && userUbo != undefined) {
      for (let i = 0; i < userUbo.length - 1; i++) {
        this.ubo.push(userUbo[i]);
        uboObg[userUbo[i]] = userUbo.at(-1)[userUbo[i]];
      }
    }
    this.ubo.push(uboObg);
  }
  apply(camera, time) {
    this.shd.apply(this.gl);

    for (let i = 0; i < this.ubo.length - 1; i++) {
      let ubo = this.ubo.at(-1)[this.ubo[i]];
      ubo.apply(
        this.gl,
        this.shd.program,
        this.shd.info.uniformBlocks[this.ubo[i]].index
      );
    }

    for (let i = 0; i < this.tex.length - 1; i++)
      if (this.shd.info.uniforms[this.tex[i]] != undefined)
        this.tex[this.tex.length - 1][this.tex[i]].apply(
          this.gl,
          i,
          this.shd.info.uniforms[this.tex[i]].loc
        );
  }
}

export function material(...arg) {
  return new _material(...arg);
}
