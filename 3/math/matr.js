import { vec3 } from "./vec3.js";

class _matr {
  m = [[], [], [], []];
  constructor(...arg) {
    this.set(...arg);
    /* alert("null matrix state"); */
    //console.log("null matrix argument init");
  }
  set() {
    if (arguments.length === 1)
      this.m = new [arguments[0], arguments[1], arguments[2], arguments[3]]();
    else if (arguments.length === 4)
      this.m = [arguments[0], arguments[1], arguments[2], arguments[3]];
    else if (arguments.length == 16)
      this.m = [
        [arguments[0], arguments[1], arguments[2], arguments[3]],
        [arguments[4], arguments[5], arguments[6], arguments[7]],
        [arguments[8], arguments[9], arguments[10], arguments[11]],
        [arguments[12], arguments[13], arguments[14], arguments[15]],
      ];
    else this.identity();
    return this;
  }
  identity() {
    this.m = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    return this;
  }
  view(Loc, At, Up1) {
    const dir = vec3(At).sub(Loc).norm();
    const right = vec3(dir).cross(Up1).norm();
    const up = vec3(right).cross(dir).norm();

    this.set(
      [right.x, up.x, -dir.x, 0],
      [right.y, up.y, -dir.y, 0],
      [right.z, up.z, -dir.z, 0],
      [-Loc.dot(right), -Loc.dot(up), Loc.dot(dir), 1]
    );
    return this;
  }
  translate(vec) {
    this.m = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [vec.x, vec.y, vec.z, 1],
    ];
    return this;
  }
  scale(vec) {
    this.m = [
      [vec.x, 0, 0, 0],
      [0, vec.y, 0, 0],
      [0, 0, vec.z, 0],
      [0, 0, 0, 1],
    ];
    return this;
  }
  mul(matr) {
    this.m = [
      [
        this.m[0][0] * matr.m[0][0] +
          this.m[0][1] * matr.m[1][0] +
          this.m[0][2] * matr.m[2][0] +
          this.m[0][3] * matr.m[3][0],
        this.m[0][0] * matr.m[0][1] +
          this.m[0][1] * matr.m[1][1] +
          this.m[0][2] * matr.m[2][1] +
          this.m[0][3] * matr.m[3][1],
        this.m[0][0] * matr.m[0][2] +
          this.m[0][1] * matr.m[1][2] +
          this.m[0][2] * matr.m[2][2] +
          this.m[0][3] * matr.m[3][2],
        this.m[0][0] * matr.m[0][3] +
          this.m[0][1] * matr.m[1][3] +
          this.m[0][2] * matr.m[2][3] +
          this.m[0][3] * matr.m[3][3],
      ],
      [
        this.m[1][0] * matr.m[0][0] +
          this.m[1][1] * matr.m[1][0] +
          this.m[1][2] * matr.m[2][0] +
          this.m[1][3] * matr.m[3][0],
        this.m[1][0] * matr.m[0][1] +
          this.m[1][1] * matr.m[1][1] +
          this.m[1][2] * matr.m[2][1] +
          this.m[1][3] * matr.m[3][1],
        this.m[1][0] * matr.m[0][2] +
          this.m[1][1] * matr.m[1][2] +
          this.m[1][2] * matr.m[2][2] +
          this.m[1][3] * matr.m[3][2],
        this.m[1][0] * matr.m[0][3] +
          this.m[1][1] * matr.m[1][3] +
          this.m[1][2] * matr.m[2][3] +
          this.m[1][3] * matr.m[3][3],
      ],
      [
        this.m[2][0] * matr.m[0][0] +
          this.m[2][1] * matr.m[1][0] +
          this.m[2][2] * matr.m[2][0] +
          this.m[2][3] * matr.m[3][0],
        this.m[2][0] * matr.m[0][1] +
          this.m[2][1] * matr.m[1][1] +
          this.m[2][2] * matr.m[2][1] +
          this.m[2][3] * matr.m[3][1],
        this.m[2][0] * matr.m[0][2] +
          this.m[2][1] * matr.m[1][2] +
          this.m[2][2] * matr.m[2][2] +
          this.m[2][3] * matr.m[3][2],
        this.m[2][0] * matr.m[0][3] +
          this.m[2][1] * matr.m[1][3] +
          this.m[2][2] * matr.m[2][3] +
          this.m[2][3] * matr.m[3][3],
      ],
      [
        this.m[3][0] * matr.m[0][0] +
          this.m[3][1] * matr.m[1][0] +
          this.m[3][2] * matr.m[2][0] +
          this.m[3][3] * matr.m[3][0],
        this.m[3][0] * matr.m[0][1] +
          this.m[3][1] * matr.m[1][1] +
          this.m[3][2] * matr.m[2][1] +
          this.m[3][3] * matr.m[3][1],
        this.m[3][0] * matr.m[0][2] +
          this.m[3][1] * matr.m[1][2] +
          this.m[3][2] * matr.m[2][2] +
          this.m[3][3] * matr.m[3][2],
        this.m[3][0] * matr.m[0][3] +
          this.m[3][1] * matr.m[1][3] +
          this.m[3][2] * matr.m[2][3] +
          this.m[3][3] * matr.m[3][3],
      ],
    ];
    return this;
  }
  frustum(l, r, b, t, n, f) {
    this.m = [
      [(2 * n) / (r - l), 0, 0, 0],
      [0, (2 * n) / (t - b), 0, 0],
      [(r + l) / (r - l), (t + b) / (t - b), -(f + n) / (f - n), -1],
      [0, 0, (-2 * n * f) / (f - n), 0],
    ];
    return this;
  }
  matrMulmatr(matr1, matr2) {
    this.m = [
      [
        matr1.m[0][0] * matr2.m[0][0] +
          matr1.m[0][1] * matr2.m[1][0] +
          matr1.m[0][2] * matr2.m[2][0] +
          matr1.m[0][3] * matr2.m[3][0],
        matr1.m[0][0] * matr2.m[0][1] +
          matr1.m[0][1] * matr2.m[1][1] +
          matr1.m[0][2] * matr2.m[2][1] +
          matr1.m[0][3] * matr2.m[3][1],
        matr1.m[0][0] * matr2.m[0][2] +
          matr1.m[0][1] * matr2.m[1][2] +
          matr1.m[0][2] * matr2.m[2][2] +
          matr1.m[0][3] * matr2.m[3][2],
        matr1.m[0][0] * matr2.m[0][3] +
          matr1.m[0][1] * matr2.m[1][3] +
          matr1.m[0][2] * matr2.m[2][3] +
          matr1.m[0][3] * matr2.m[3][3],
      ],
      [
        matr1.m[1][0] * matr2.m[0][0] +
          matr1.m[1][1] * matr2.m[1][0] +
          matr1.m[1][2] * matr2.m[2][0] +
          matr1.m[1][3] * matr2.m[3][0],
        matr1.m[1][0] * matr2.m[0][1] +
          matr1.m[1][1] * matr2.m[1][1] +
          matr1.m[1][2] * matr2.m[2][1] +
          matr1.m[1][3] * matr2.m[3][1],
        matr1.m[1][0] * matr2.m[0][2] +
          matr1.m[1][1] * matr2.m[1][2] +
          matr1.m[1][2] * matr2.m[2][2] +
          matr1.m[1][3] * matr2.m[3][2],
        matr1.m[1][0] * matr2.m[0][3] +
          matr1.m[1][1] * matr2.m[1][3] +
          matr1.m[1][2] * matr2.m[2][3] +
          matr1.m[1][3] * matr2.m[3][3],
      ],
      [
        matr1.m[2][0] * matr2.m[0][0] +
          matr1.m[2][1] * matr2.m[1][0] +
          matr1.m[2][2] * matr2.m[2][0] +
          matr1.m[2][3] * matr2.m[3][0],
        matr1.m[2][0] * matr2.m[0][1] +
          matr1.m[2][1] * matr2.m[1][1] +
          matr1.m[2][2] * matr2.m[2][1] +
          matr1.m[2][3] * matr2.m[3][1],
        matr1.m[2][0] * matr2.m[0][2] +
          matr1.m[2][1] * matr2.m[1][2] +
          matr1.m[2][2] * matr2.m[2][2] +
          matr1.m[2][3] * matr2.m[3][2],
        matr1.m[2][0] * matr2.m[0][3] +
          matr1.m[2][1] * matr2.m[1][3] +
          matr1.m[2][2] * matr2.m[2][3] +
          matr1.m[2][3] * matr2.m[3][3],
      ],
      [
        matr1.m[3][0] * matr2.m[0][0] +
          matr1.m[3][1] * matr2.m[1][0] +
          matr1.m[3][2] * matr2.m[2][0] +
          matr1.m[3][3] * matr2.m[3][0],
        matr1.m[3][0] * matr2.m[0][1] +
          matr1.m[3][1] * matr2.m[1][1] +
          matr1.m[3][2] * matr2.m[2][1] +
          matr1.m[3][3] * matr2.m[3][1],
        matr1.m[3][0] * matr2.m[0][2] +
          matr1.m[3][1] * matr2.m[1][2] +
          matr1.m[3][2] * matr2.m[2][2] +
          matr1.m[3][3] * matr2.m[3][2],
        matr1.m[3][0] * matr2.m[0][3] +
          matr1.m[3][1] * matr2.m[1][3] +
          matr1.m[3][2] * matr2.m[2][3] +
          matr1.m[3][3] * matr2.m[3][3],
      ],
    ];
    return this;
  }
  pointTransform(vec) {
    return vec3(
      vec.x * this.m[0][0] +
        vec.y * this.m[1][0] +
        vec.z * this.m[2][0] +
        this.m[3][0],
      vec.x * this.m[0][1] +
        vec.y * this.m[1][1] +
        vec.z * this.m[2][1] +
        this.m[3][1],
      vec.x * this.m[0][2] +
        vec.y * this.m[1][2] +
        vec.z * this.m[2][2] +
        this.m[3][2]
    );
  }
  vecTransform(vec) {
    return vec3(
      vec.x * this.m[0][0] + vec.y * this.m[1][0] + vec.z * this.m[2][0],
      vec.x * this.m[0][1] + vec.y * this.m[1][1] + vec.z * this.m[2][1],
      vec.x * this.m[0][2] + vec.y * this.m[1][2] + vec.z * this.m[2][2]
    );
  }
  rotateX(angle) {
    const AngleInDegree = (angle * Math.PI) / 180;
    this.m[1][1] = this.m[2][2] = Math.cos(AngleInDegree);
    this.m[1][2] = Math.sin(AngleInDegree);
    this.m[2][1] = -this.m[1][2];
    return this;
  }
  rotateY(angle) {
    const AngleInDegree = (angle * Math.PI) / 180;
    this.m[0][0] = this.m[2][2] = Math.cos(AngleInDegree);
    this.m[2][0] = Math.sin(AngleInDegree);
    this.m[0][2] = -this.m[2][0];
    return this;
  }
  rotateZ(angle) {
    const AngleInDegree = (angle * Math.PI) / 180;
    this.m[0][0] = this.m[1][1] = Math.cos(AngleInDegree);
    this.m[0][1] = -Math.sin(AngleInDegree);
    this.m[1][0] = -this.m[0][1];

    return this;
  }
  unpack() {
    return [
      this.m[0][0],
      this.m[0][1],
      this.m[0][2],
      this.m[0][3],

      this.m[1][0],
      this.m[1][1],
      this.m[1][2],
      this.m[1][3],

      this.m[2][0],
      this.m[2][1],
      this.m[2][2],
      this.m[2][3],

      this.m[3][0],
      this.m[3][1],
      this.m[3][2],
      this.m[3][3],
    ];
  }
  ortho(left, right, bottom, top, near, far) {
    this.m = [
      [2 / (right - left), 0, 0, 0],
      [0, 2 / (top - bottom), 0, 0],
      [0, 0, -2 / (far - near), 0],
      [
        -(right + left) / (right - left),
        -(top + bottom) / (top - bottom),
        -(far + near) / (far - near),
        1,
      ],
    ];
    return this;
  } /* End of 'MatrOrtho' function */
}

export function matr(...arg) {
  return new _matr(...arg);
}
