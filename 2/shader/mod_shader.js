function ShaderUploadToGL(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const Buf = gl.getShaderInfoLog(shader);
    console.log(Buf);
    alert("!?!??!?!");
  }

  return shader;
}
function ShaderGetTextFromFile(filename) {
  return fetch(filename)
    .then((res) => res.text())
    .then((data) => {
      return data;
    });
}

export function LoadProgram(gl, pass) {
  return new Promise((resolve, reject) => {
    const vs = ShaderGetTextFromFile(pass + "\\vert.glsl");
    const fs = ShaderGetTextFromFile(pass + "\\frag.glsl");
    Promise.all([vs, fs]).then((res) => {
      const vertexShader = ShaderUploadToGL(gl, gl.VERTEX_SHADER, res[0]);
      const fragmentShader = ShaderUploadToGL(gl, gl.FRAGMENT_SHADER, res[1]);
      const program = gl.createProgram();

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const Buf = gl.getProgramInfoLog(program);
        reject(Buf);
      }
      resolve(program);
    });
  });
}

export function LoadPos(gl, program, pos) {
  const posloc = gl.getAttribLocation(program, "in_pos");

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
  gl.vertexAttribPointer(posloc, 4, gl.FLOAT, false, 0, 0);
  return posloc;
}
