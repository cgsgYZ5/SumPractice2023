class _texture {
  isCreate = false;

  texture;
  url;
  type;

  constructor(gl, allTex = null, url, type = "tex2d") {
    this.url = url;
    this.type = type;

    if (allTex != null) {
      const tex = this.search(allTex, url);
      if (tex == null) allTex.push(this);
      else {
        this.texture = tex.texture;
        this.isCreate = tex.isCreate;
        return;
      }
    }
    if (type == "tex2d") this.load2d(gl, url);
    else if (type == "cube") this.loadCube(gl, url);
  }
  loadCube() {}
  load2d(gl, url) {
    this.type = gl.TEXTURE_2D;
    this.texture = gl.createTexture();

    this.promise = new Promise(() => {
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
    });
  }
  search(allTex, url) {
    allTex.forEach((tex) => {
      if (tex.url == url) return tex;
    });
    return null;
  }
  apply(gl, num, blk) {
    if (this.isCreate == true && blk < gl.MAX_UNIFORM_BUFFER_BINDINGS) {
      gl.activeTexture(this.type + num);

      gl.bindTexture(this.type, this.texture);

      gl.uniform1i(blk, num);
    }
  }
  texFlagUpdate(gl, ubo, off) {
    if (this.promise != undefined)
      this.promise.then(() => ubo.update(gl, off, new Float32Array([1])));
    else ubo.update(gl, off, new Float32Array([1]));
  }
}
export function texture(...arg) {
  return new _texture(...arg);
}
