import { shader } from "./shader.js";
import { ubo } from "./buffer.js";
import { texture } from "./texture.js";

/* GL module */
class _material {
  gl;

  tex = [];
  shd;
  ubo = [];

  constructor(gl, shdPass, vertData, mtlData, texData, userUbo = null) {
    this.gl = gl;
    this.vertData = vertData;

    let mtlMas = [];
    for (let i = 0; i < mtlData.length - 1; i++)
      mtlMas.push(...mtlData[mtlData.length - 1][mtlData[i]]);

    let texObj = [];
    for (let i = 0; i < texData.length - 1; i++) {
      if (texData[texData.length - 1][texData[i]] != undefined) {
        this.tex.push(texData[i]);
        let tmp = texData[texData.length - 1][texData[i]];
        if (typeof tmp == "string") texObj[texData[i]] = texture(gl, tmp);
        else texObj[texData[i]] = tmp;
      } else alert("in tex mass");
    }
    this.tex.push(texObj);

    this.ubo[0] = ubo(gl, 48, 0, "projMatrix");
    mtlMas.push(-1);
    mtlMas.push(-1);
    this.ubo[1] = ubo(gl, new Float32Array(mtlMas), 1, "primMaterial");
    this.ubo[2] = userUbo;

    this.shd = shader(gl, shdPass);
  }
  apply(camera, time) {
    this.shd.apply(this.gl);

    for (let i = 0; i < this.tex.length - 1; i++)
      if (this.shd.info.uniforms[this.tex[i]] != undefined)
        this.tex[this.tex.length - 1][this.tex[i]].apply(
          this.gl,
          i,
          this.shd.info.uniforms[this.tex[i]].loc
        );

    this.ubo[1].apply(this.gl, this.shd);
  }
}

export function material(...arg) {
  return new _material(...arg);
}
