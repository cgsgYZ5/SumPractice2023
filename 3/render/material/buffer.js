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

      gl.bufferData(this.type, 4 * data, gl.STATIC_DRAW);
    } else {
      this.size = data.length;

      gl.bufferData(this.type, data, gl.STATIC_DRAW);
    }
  }

  update(gl, off, newData) {
    gl.bindBuffer(this.type, this.bufId);

    gl.bufferSubData(this.type, off, newData);
  }
  apply(gl) {
    gl.bindBuffer(this.type, this.bufId);
  }
}

/* UBO module */

class _ubo extends _buffer {
  bindPoint;

  constructor(gl, data, bindPoint) {
    super(gl, gl.UNIFORM_BUFFER, data);
    if (this.size % 16 != 0) console.error("buffer size not 16 * n");

    this.bindPoint = bindPoint;
  }
  apply(gl, prg, blk) {
    if (blk < gl.MAX_UNIFORM_BUFFER_BINDINGS) {
      if (this.size < 48)
        gl.bindBufferRange(gl.UNIFORM_BUFFER, blk, this.bufId, 0, this.size);
      gl.uniformBlockBinding(prg, blk, this.bindPoint);

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
