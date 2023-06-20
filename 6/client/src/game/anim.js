import { error } from "../tools/tools.js";

// pos = tank.pos;
// this.type = gl.TRIANGLE_STRIP;
// index = tank.index;
// this.numOfV = 4;
let canvas,
  gl,
  shd = {},
  massTex = {},
  massPrim = {},
  createdElements = {};

const wall = {
  pos: new Float32Array([1, 1, 1, 1, 1, -1, 0, 1, -1, -1, 0, 0, -1, 1, 1, 0]),
};
const tank = {
  //pos: new Float32Array([4, 4, 1, 1, 4, -4, 0, 1, -4, -4, 0, 0, -4, 4, 1, 0]),
  // pos: new Float32Array([
  //   0.5, 0.5, 1, 1, 0.5, -0.5, 0, 1, -0.5, -0.5, 0, 0, -0.5, 0.5, 1, 0,
  // ]),
  pos: new Float32Array([
    50, 50, 1, 1, 50, -50, 0, 1, -50, -50, 0, 0, -50, 50, 1, 0,
  ]),
  index: new Uint16Array([0, 1, 3, 2]),
  type: "triangle",
};

export function initGl() {
  canvas = document.getElementById("canva");

  if (canvas == undefined) {
    console.log(`aaaaa Canvas`);
    error("canvas is not defined", "../homePage/homePage.html");
  }
  gl = canvas.getContext("webgl2");
  if (gl == undefined) {
    console.log(`aaaaa GL`);
    error("gl is not defined", "../homePage/homePage.html");
  }

  const shdText = [
    `#version 300 es
precision highp float;
in vec2 in_pos;
in vec2 in_tex;

out vec2 texCoord;

uniform vec2 screenSize;
uniform vec2 pos;
uniform float angle;

void main(){
  vec2 tmp = vec2(
    in_pos.x * cos(angle) + in_pos.y * sin(angle) + pos.x,
    in_pos.y * cos(angle) - in_pos.x * sin(angle) + pos.y);
    // cos(angle) + sin(angle),
    // cos(angle)  - sin(angle));
  gl_Position = vec4(tmp.x / screenSize.x * 2.0 , tmp.y / screenSize.y * 2.0, 0, 1);
  //gl_Position = vec4(tmp.x / 700.0 * 2.0 - 1.0, tmp.y / 500.0 * 2.0 - 1.0, 0, 1);
  texCoord = in_tex;
}`,
    `#version 300 es
precision highp float;
out vec4 out_color;

uniform sampler2D uSampler;
in vec2 texCoord;
  void main(){
    out_color = texture(uSampler, texCoord);
    out_color = vec4(0, 1, 1, 1);
}`,
  ];
  const shader = [
    gl.createShader(gl.VERTEX_SHADER),
    gl.createShader(gl.FRAGMENT_SHADER),
  ];

  gl.shaderSource(shader[0], shdText[0]);
  gl.compileShader(shader[0]);
  if (!gl.getShaderParameter(shader[0], gl.COMPILE_STATUS)) {
    const Buf = gl.getShaderInfoLog(shader[0]);
    console.log(Buf);
  }
  gl.shaderSource(shader[1], shdText[1]);
  gl.compileShader(shader[1]);
  if (!gl.getShaderParameter(shader[1], gl.COMPILE_STATUS)) {
    const Buf = gl.getShaderInfoLog(shader[1]);
    console.log(Buf);
  }
  shd.prg = gl.createProgram();

  gl.attachShader(shd.prg, shader[0]);
  gl.attachShader(shd.prg, shader[1]);

  gl.linkProgram(shd.prg);
  if (!gl.getProgramParameter(shd.prg, gl.LINK_STATUS)) {
    const Buf = gl.getProgramInfoLog(shd.prg);
    console.log(Buf);
  }

  shd.locScreenSize = gl.getUniformLocation(shd.prg, "screenSize");

  shd.locPos = gl.getUniformLocation(shd.prg, "pos");
  shd.locAngle = gl.getUniformLocation(shd.prg, "angle");

  shd.in_pos = gl.getAttribLocation(shd.prg, "in_pos");
  shd.in_tex = gl.getAttribLocation(shd.prg, "in_tex");

  gl.useProgram(shd.prg);

  createTank();
}

function createTex(name, url) {
  this.type = gl.TEXTURE_2D;
  this.texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  if (typeof url == "string") {
    const image = new Image();
    image.onload = () => {
      this.promise = undefined;
      this.isCreate = true;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );

      if (
        (Math.log(image.width) / Math.log(2)) % 1 === 0 &&
        (Math.log(image.height) / Math.log(2)) % 1 === 0
      ) {
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };
    image.src = url;

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([128, 128, 128, 255])
    );
  } else
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(url)
    );

  this.loc = gl.getUniformLocation(shd.prg, "uSampler");

  this.apply = function () {
    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.uniform1i(this.loc, 0);
  };
  massTex[name] = this;
}
function createPrim(name, pos, index, type) {
  this.type = type;
  this.VA = gl.createVertexArray();
  gl.bindVertexArray(this.VA);

  this.VB = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.VB);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  this.numOfV = pos.length;

  if (index) {
    this.IB = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IB);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Int16Array(index),
      gl.STATIC_DRAW
    );
    this.numOfV = index.length;
  }
  gl.vertexAttribPointer(shd.in_pos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(shd.in_pos);

  gl.vertexAttribPointer(shd.in_tex, 2, gl.FLOAT, false, 16, 8);
  gl.enableVertexAttribArray(shd.in_tex);

  this.draw = function (pos, angle) {
    gl.uniform2fv(shd.locScreenSize, [
      gl.canvas.clientWidth,
      gl.canvas.clientHeight,
    ]);
    gl.uniform2fv(shd.locPos, [pos.x, pos.y]);
    gl.uniform1f(shd.locAngle, angle);

    gl.bindVertexArray(this.VA);
    if (this.IB != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IB);
      gl.drawElements(this.type, this.numOfV, gl.UNSIGNED_SHORT, 0);
    } else gl.drawArrays(this.type, 0, this.numOfV);
  };

  massPrim[name] = this;
  return this;
}
function _createTank() {
  if (!massPrim["tank"])
    this.prim = new createPrim(
      "tank",
      tank.pos,
      tank.index,
      /*gl.TRIANGLES */
      gl.TRIANGLE_STRIP
    );
  else this.prim = massTex["tank"];

  if (!massTex["tank"]) this.tex = new createTex("tank", [128, 0, 128, 256]);
  else this.tex = massPrim["tank"];

  this.draw = function (info, userPos) {
    this.tex.apply();
    this.prim.draw(
      { x: info.pos.x - userPos.x, y: info.pos.y - userPos.y },
      info.angle,
      this.tex
    );
  };
  createdElements["tank"] = this;
  return this;
}
export function createTank() {
  return new _createTank();
}
export function drawAll(drawElements) {
  let userPos = drawElements[0].info.pos;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(1, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawElements.forEach((element) => {
    createdElements[element.name].draw(element.info, userPos);
  });
}
