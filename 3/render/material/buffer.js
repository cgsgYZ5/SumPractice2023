/* Buffer mudule */

class _buffer {
  bindPoint;
  bufId;
  type;
  size;

  constructor(gl, type, data) {
    this.bufId = gl.createBuffer();
    this.type = type;

    gl.bindBuffer(this.type, this.bufId);
    if (typeof data == "number") {
      this.size = data;
      gl.bufferData(this.type, data, gl.STATIC_DRAW);
    } else {
      this.size = data.length;
      gl.bufferData(this.type, data, gl.STATIC_DRAW);
    }
  }

  update(gl, newData) {
    gl.bindBuffer(this.type, this.bufId);
    gl.bufferData(this.type, newData, gl.STATIC_DRAW);

    /*gl.bufferSubData(this.type, 0, new Float32Array(newData));*/
  }
  apply(gl) {
    gl.bindBuffer(this.type, this.bufId);
  }
}

/* UBO module */

class _ubo extends _buffer {
  bindPoint;
  uBlockName;

  constructor(gl, data, bindPoint, uBlockName) {
    super(gl, gl.UNIFORM_BUFFER, data);
    this.bindPoint = bindPoint;
    this.uBlockName = uBlockName;
  }
  apply(gl, shd) {
    const blk = shd.info.uniformBlocks[this.uBlockName].bind;
    if (blk < gl.MAX_UNIFORM_BUFFER_BINDINGS) {
      gl.uniformBlockBinding(shd.program, blk, this.bindPoint);

      gl.bindBufferBase(gl.UNIFORM_BUFFER, this.bindPoint, this.bufId);
    }
  }
}

export function buffer(...arg) {
  return new _buffer(...arg);
}
export function ubo(...arg) {
  return new _ubo(...arg);
}
