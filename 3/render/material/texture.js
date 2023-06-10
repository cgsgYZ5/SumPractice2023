class _texture {
  isLoad;
  url;
  texture;

  constructor(gl, url) {
    this.url = url;
    this.isLoad = false;
    this.texture = gl.createTexture();

    const image = new Image();
    this.promise = new Promise(
      (image.onload = () => {
        this.isLoad = true;
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
        gl.bindTexture(gl.TEXTURE_2D, null);
      })
    );
    image.src = url;
  }
  texFlagUpdate(gl, off) {
    if (shd.program.then != undefined) {
      shd.program.then(() => {
        ubo.update(gl, off, new Float32Array([1]));
      });
    } else {
      ubo.update(gl, off, new Float32Array([1]));
    }
  }
  apply(gl, num, blk) {
    if (this.isLoad == true) {
      gl.activeTexture(gl.TEXTURE0 + num);

      // Связываем текстуру с регистром 0
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      // Указываем шейдеру, что мы связали текстуру с текстурным регистром 0
      gl.uniform1i(blk, num);
    }
  }
}
export function texture(...arg) {
  return new _texture(...arg);
}
