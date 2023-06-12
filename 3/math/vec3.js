class _vec3 {
  x;
  y;
  z;
  constructor(x, y, z) {
    if (typeof x == "object") (this.x = x.x), (this.y = x.y), (this.z = x.z);
    else if (x != undefined && y == undefined && z == undefined)
      (this.x = x), (this.y = x), (this.z = x);
    else if (x != undefined && y != undefined && z != undefined)
      (this.x = x), (this.y = y), (this.z = z);
    else (this.x = 0), (this.y = 0), (this.z = 0);
  }
  set(x, y, z) {
    if (x != undefined && y != undefined && z != undefined)
      (this.x = x), (this.y = y), (this.z = z);
    return this;
  }
  add(vec3) {
    (this.x += vec3.x), (this.y += vec3.y), (this.z += vec3.z);
    return this;
  }
  sub(vec3) {
    (this.x -= vec3.x), (this.y -= vec3.y), (this.z -= vec3.z);
    return this;
  }
  mul(k) {
    (this.x *= k), (this.y *= k), (this.z *= k);
    return this;
  }
  div(k) {
    if (k == 0) this.mul(0);
    else (this.x /= k), (this.y /= k), (this.z /= k);
    return this;
  }
  len2() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  len() {
    return Math.sqrt(this.len2());
  }
  norm() {
    return this.div(this.len());
  }
  dot(vec) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
  }
  cross(vec) {
    return this.set(
      this.y * vec.z - this.z * vec.y,
      -this.x * vec.z + this.z * vec.x,
      this.x * vec.y - this.y * vec.x
    );
  }
  unpack() {
    return [this.x, this.y, this.z];
  }
}

export function vec3(...arg) {
  return new _vec3(...arg);
}
