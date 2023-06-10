/* Shader module */
import { getTextFromFile } from "./../../tools/textload.js";

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

class _shader {
  pass;
  program;

  info = { attrs: [], uniforms: [], uniformBlocks: [] };

  constructor(gl, pass) {
    if (typeof pass == "string") {
      this.program = new Promise((resolve, reject) => {
        const vs = getTextFromFile(pass + "/vert.glsl");
        const fs = getTextFromFile(pass + "/frag.glsl");
        Promise.all([vs, fs]).then((res) => {
          const vertexShader = ShaderUploadToGL(gl, gl.VERTEX_SHADER, res[0]);
          const fragmentShader = ShaderUploadToGL(
            gl,
            gl.FRAGMENT_SHADER,
            res[1]
          );
          this.program = gl.createProgram();

          gl.attachShader(this.program, vertexShader);
          gl.attachShader(this.program, fragmentShader);

          gl.linkProgram(this.program);
          if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            const Buf = gl.getProgramInfoLog(this.program);
            reject(Buf);
          } else this.getInfo(gl);
          resolve(this.program);
        });
        //.then((prg) => (this.program = prg));
      });
      const a = gl.getParameter(gl.UNIFORM_BUFFER_OFFSET_ALIGNMENT);
      this.pass = pass;
    } else {
      /*
      const vertexShader = ShaderUploadToGL(gl, gl.VERTEX_SHADER, res[0]);
      const fragmentShader = ShaderUploadToGL(gl, gl.FRAGMENT_SHADER, res[1]);
      this.program = gl.createProgram();

      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);

      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        const Buf = gl.getProgramInfoLog(this.program);
        reject(Buf);
      } else this.getInfo(gl);
      resolve(this.program);*/
    }
  }
  apply(gl) {
    gl.useProgram(this.program);
  }
  getInfo(gl) {
    // Fill shader attributes info
    let countAttr = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < countAttr; i++) {
      const info = gl.getActiveAttrib(this.program, i);
      this.info.attrs[info.name] = {
        name: info.name,
        type: info.type,
        size: info.size,
        loc: gl.getAttribLocation(this.program, info.name),
      };
    }
    // Fill shader uniforms info
    let countUniform = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < countUniform; i++) {
      const info = gl.getActiveUniform(this.program, i);
      this.info.uniforms[info.name] = {
        name: info.name,
        type: info.type,
        size: info.size,
        loc: gl.getUniformLocation(this.program, info.name),
        /*
        off: getActiveUniformBlockParameter(
          this.program,
          uniformBlockIndex,
          info.name
        ),
        */
      };
    }
    // Fill shader uniform blocks info
    let countUniformBlocks = gl.getProgramParameter(
      this.program,
      gl.ACTIVE_UNIFORM_BLOCKS
    );
    for (let i = 0; i < countUniformBlocks; i++) {
      const info = gl.getActiveUniformBlockName(this.program, i);
      const idx = gl.getUniformBlockIndex(this.program, info);
      this.info.uniformBlocks[info] = {
        name: info,
        index: idx,
        size: gl.getActiveUniformBlockParameter(
          this.program,
          idx,
          gl.UNIFORM_BLOCK_DATA_SIZE
        ),
        bind: gl.getActiveUniformBlockParameter(
          this.program,
          idx,
          gl.UNIFORM_BLOCK_BINDING
        ),
        uIndex: gl.getActiveUniformBlockParameter(
          this.program,
          idx,
          gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES
        ),
        uNames: [],
      };
      this.info.uniformBlocks[info].uOffset = gl.getActiveUniforms(
        this.program,
        this.info.uniformBlocks[info].uIndex,
        gl.UNIFORM_OFFSET
      );
      for (let i = 0; i < this.info.uniformBlocks[info].uIndex.length; i++)
        this.info.uniformBlocks[info].uNames[i] = gl.getActiveUniform(
          this.program,
          this.info.uniformBlocks[info].uIndex[i]
        ).name;
    }
  }
}

export function shader(...arg) {
  return new _shader(...arg);
}
