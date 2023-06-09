import { shader } from "./shader.js";
import { ubo } from "./buffer.js";
import { texture } from "./texture.js";

/* GL module */
class _material {
  gl;
  name;

  texMas = [];
  shd;
  ubo = [];

  constructor(gl, name, vertData, mtlData, texData, shdPass, userUbo = null) {
    this.name = name;
    this.gl = gl;
    this.vertData = vertData;

    for (let i = 0; i < texData.length; i++)
      this.texMas.push(texture(gl, texData[i]));

    this.ubo[0] = ubo(gl, 48, 0, "Matrix");
    this.ubo[1] = ubo(gl, new Float32Array(mtlData), 1, "material");
    this.ubo[2] = userUbo;

    this.shd = shader(gl, shdPass);
  }
  apply(camera, time) {
    this.shd.apply(this.gl);

    this.texMas.forEach((tex) => tex.apply(this.gl, this.shd.program));
    //this.ubo[1].apply(this.gl, this.shd);
  }
}

export function material(...arg) {
  return new _material(...arg);
}
