class _texture {
  isLoad;
  url;
  texture;

  constructor(gl, url) {
    this.url = url;
    this.isLoad = false;
    this.texture = gl.createTexture();

    const image = new Image();
    image.onload = () => {
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
    };
    image.src = url;
  }
  apply(gl, shd) {
    if (this.isLoad == true) {
      const blk = gl.getUniformLocation(shd, "uSampler");
      gl.activeTexture(gl.TEXTURE0);

      // Связываем текстуру с регистром 0
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      // Указываем шейдеру, что мы связали текстуру с текстурным регистром 0
      gl.uniform1i(blk, 0);
    }
  }
}
export function texture(...arg) {
  return new _texture(...arg);
}
