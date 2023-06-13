(function (exports) {
  'use strict';

  /* GL module */

  class _glContext {
    canvas;
    id;
    /** @type {WebGLRenderingContext} */
    gl;
    constructor(id) {
      this.id = id;
      this.canvas = document.getElementById(id);
      if (this.canvas != null) {
        this.gl = this.canvas.getContext("webgl2");
        this.gl.cullFace(this.gl.FRONT_AND_BACK);
        this.gl.enable(this.gl.DEPTH_TEST);
      } else this.gl = null;
    }
  }
  function glContext(...arg) {
    return new _glContext(...arg);
  }

  class _vec3 {
    x;
    y;
    z;
    constructor(x, y, z) {
      if (typeof x == "object") this.x = x.x, this.y = x.y, this.z = x.z;else if (x != undefined && y == undefined && z == undefined) this.x = x, this.y = x, this.z = x;else if (x != undefined && y != undefined && z != undefined) this.x = x, this.y = y, this.z = z;else this.x = 0, this.y = 0, this.z = 0;
    }
    set(x, y, z) {
      if (x != undefined && y != undefined && z != undefined) this.x = x, this.y = y, this.z = z;
      return this;
    }
    add(vec3) {
      this.x += vec3.x, this.y += vec3.y, this.z += vec3.z;
      return this;
    }
    sub(vec3) {
      this.x -= vec3.x, this.y -= vec3.y, this.z -= vec3.z;
      return this;
    }
    mul(k) {
      this.x *= k, this.y *= k, this.z *= k;
      return this;
    }
    div(k) {
      if (k == 0) this.mul(0);else this.x /= k, this.y /= k, this.z /= k;
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
      return this.set(this.y * vec.z - this.z * vec.y, -this.x * vec.z + this.z * vec.x, this.x * vec.y - this.y * vec.x);
    }
    unpack() {
      return [this.x, this.y, this.z];
    }
  }
  function vec3(...arg) {
    return new _vec3(...arg);
  }

  class _matr {
    m = [[], [], [], []];
    constructor(...arg) {
      this.set(...arg);
      /* alert("null matrix state"); */
      //console.log("null matrix argument init");
    }

    set() {
      if (arguments.length === 1) this.m = new [arguments[0], arguments[1], arguments[2], arguments[3]]();else if (arguments.length === 4) this.m = [arguments[0], arguments[1], arguments[2], arguments[3]];else if (arguments.length == 16) this.m = [[arguments[0], arguments[1], arguments[2], arguments[3]], [arguments[4], arguments[5], arguments[6], arguments[7]], [arguments[8], arguments[9], arguments[10], arguments[11]], [arguments[12], arguments[13], arguments[14], arguments[15]]];else this.identity();
      return this;
    }
    identity() {
      this.m = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
      return this;
    }
    view(Loc, At, Up1) {
      const dir = vec3(At).sub(Loc).norm();
      const right = vec3(dir).cross(Up1).norm();
      const up = vec3(right).cross(dir).norm();
      this.set([right.x, up.x, -dir.x, 0], [right.y, up.y, -dir.y, 0], [right.z, up.z, -dir.z, 0], [-Loc.dot(right), -Loc.dot(up), Loc.dot(dir), 1]);
      return this;
    }
    translate(vec) {
      this.m = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [vec.x, vec.y, vec.z, 1]];
      return this;
    }
    scale(vec) {
      this.m = [[vec.x, 0, 0, 0], [0, vec.y, 0, 0], [0, 0, vec.z, 0], [0, 0, 0, 1]];
      return this;
    }
    mul(matr) {
      this.m = [[this.m[0][0] * matr.m[0][0] + this.m[0][1] * matr.m[1][0] + this.m[0][2] * matr.m[2][0] + this.m[0][3] * matr.m[3][0], this.m[0][0] * matr.m[0][1] + this.m[0][1] * matr.m[1][1] + this.m[0][2] * matr.m[2][1] + this.m[0][3] * matr.m[3][1], this.m[0][0] * matr.m[0][2] + this.m[0][1] * matr.m[1][2] + this.m[0][2] * matr.m[2][2] + this.m[0][3] * matr.m[3][2], this.m[0][0] * matr.m[0][3] + this.m[0][1] * matr.m[1][3] + this.m[0][2] * matr.m[2][3] + this.m[0][3] * matr.m[3][3]], [this.m[1][0] * matr.m[0][0] + this.m[1][1] * matr.m[1][0] + this.m[1][2] * matr.m[2][0] + this.m[1][3] * matr.m[3][0], this.m[1][0] * matr.m[0][1] + this.m[1][1] * matr.m[1][1] + this.m[1][2] * matr.m[2][1] + this.m[1][3] * matr.m[3][1], this.m[1][0] * matr.m[0][2] + this.m[1][1] * matr.m[1][2] + this.m[1][2] * matr.m[2][2] + this.m[1][3] * matr.m[3][2], this.m[1][0] * matr.m[0][3] + this.m[1][1] * matr.m[1][3] + this.m[1][2] * matr.m[2][3] + this.m[1][3] * matr.m[3][3]], [this.m[2][0] * matr.m[0][0] + this.m[2][1] * matr.m[1][0] + this.m[2][2] * matr.m[2][0] + this.m[2][3] * matr.m[3][0], this.m[2][0] * matr.m[0][1] + this.m[2][1] * matr.m[1][1] + this.m[2][2] * matr.m[2][1] + this.m[2][3] * matr.m[3][1], this.m[2][0] * matr.m[0][2] + this.m[2][1] * matr.m[1][2] + this.m[2][2] * matr.m[2][2] + this.m[2][3] * matr.m[3][2], this.m[2][0] * matr.m[0][3] + this.m[2][1] * matr.m[1][3] + this.m[2][2] * matr.m[2][3] + this.m[2][3] * matr.m[3][3]], [this.m[3][0] * matr.m[0][0] + this.m[3][1] * matr.m[1][0] + this.m[3][2] * matr.m[2][0] + this.m[3][3] * matr.m[3][0], this.m[3][0] * matr.m[0][1] + this.m[3][1] * matr.m[1][1] + this.m[3][2] * matr.m[2][1] + this.m[3][3] * matr.m[3][1], this.m[3][0] * matr.m[0][2] + this.m[3][1] * matr.m[1][2] + this.m[3][2] * matr.m[2][2] + this.m[3][3] * matr.m[3][2], this.m[3][0] * matr.m[0][3] + this.m[3][1] * matr.m[1][3] + this.m[3][2] * matr.m[2][3] + this.m[3][3] * matr.m[3][3]]];
      return this;
    }
    frustum(l, r, b, t, n, f) {
      this.m = [[2 * n / (r - l), 0, 0, 0], [0, 2 * n / (t - b), 0, 0], [(r + l) / (r - l), (t + b) / (t - b), -(f + n) / (f - n), -1], [0, 0, -2 * n * f / (f - n), 0]];
      return this;
    }
    matrMulmatr(matr1, matr2) {
      this.m = [[matr1.m[0][0] * matr2.m[0][0] + matr1.m[0][1] * matr2.m[1][0] + matr1.m[0][2] * matr2.m[2][0] + matr1.m[0][3] * matr2.m[3][0], matr1.m[0][0] * matr2.m[0][1] + matr1.m[0][1] * matr2.m[1][1] + matr1.m[0][2] * matr2.m[2][1] + matr1.m[0][3] * matr2.m[3][1], matr1.m[0][0] * matr2.m[0][2] + matr1.m[0][1] * matr2.m[1][2] + matr1.m[0][2] * matr2.m[2][2] + matr1.m[0][3] * matr2.m[3][2], matr1.m[0][0] * matr2.m[0][3] + matr1.m[0][1] * matr2.m[1][3] + matr1.m[0][2] * matr2.m[2][3] + matr1.m[0][3] * matr2.m[3][3]], [matr1.m[1][0] * matr2.m[0][0] + matr1.m[1][1] * matr2.m[1][0] + matr1.m[1][2] * matr2.m[2][0] + matr1.m[1][3] * matr2.m[3][0], matr1.m[1][0] * matr2.m[0][1] + matr1.m[1][1] * matr2.m[1][1] + matr1.m[1][2] * matr2.m[2][1] + matr1.m[1][3] * matr2.m[3][1], matr1.m[1][0] * matr2.m[0][2] + matr1.m[1][1] * matr2.m[1][2] + matr1.m[1][2] * matr2.m[2][2] + matr1.m[1][3] * matr2.m[3][2], matr1.m[1][0] * matr2.m[0][3] + matr1.m[1][1] * matr2.m[1][3] + matr1.m[1][2] * matr2.m[2][3] + matr1.m[1][3] * matr2.m[3][3]], [matr1.m[2][0] * matr2.m[0][0] + matr1.m[2][1] * matr2.m[1][0] + matr1.m[2][2] * matr2.m[2][0] + matr1.m[2][3] * matr2.m[3][0], matr1.m[2][0] * matr2.m[0][1] + matr1.m[2][1] * matr2.m[1][1] + matr1.m[2][2] * matr2.m[2][1] + matr1.m[2][3] * matr2.m[3][1], matr1.m[2][0] * matr2.m[0][2] + matr1.m[2][1] * matr2.m[1][2] + matr1.m[2][2] * matr2.m[2][2] + matr1.m[2][3] * matr2.m[3][2], matr1.m[2][0] * matr2.m[0][3] + matr1.m[2][1] * matr2.m[1][3] + matr1.m[2][2] * matr2.m[2][3] + matr1.m[2][3] * matr2.m[3][3]], [matr1.m[3][0] * matr2.m[0][0] + matr1.m[3][1] * matr2.m[1][0] + matr1.m[3][2] * matr2.m[2][0] + matr1.m[3][3] * matr2.m[3][0], matr1.m[3][0] * matr2.m[0][1] + matr1.m[3][1] * matr2.m[1][1] + matr1.m[3][2] * matr2.m[2][1] + matr1.m[3][3] * matr2.m[3][1], matr1.m[3][0] * matr2.m[0][2] + matr1.m[3][1] * matr2.m[1][2] + matr1.m[3][2] * matr2.m[2][2] + matr1.m[3][3] * matr2.m[3][2], matr1.m[3][0] * matr2.m[0][3] + matr1.m[3][1] * matr2.m[1][3] + matr1.m[3][2] * matr2.m[2][3] + matr1.m[3][3] * matr2.m[3][3]]];
      return this;
    }
    pointTransform(vec) {
      return vec3(vec.x * this.m[0][0] + vec.y * this.m[1][0] + vec.z * this.m[2][0] + this.m[3][0], vec.x * this.m[0][1] + vec.y * this.m[1][1] + vec.z * this.m[2][1] + this.m[3][1], vec.x * this.m[0][2] + vec.y * this.m[1][2] + vec.z * this.m[2][2] + this.m[3][2]);
    }
    vecTransform(vec) {
      return vec3(vec.x * this.m[0][0] + vec.y * this.m[1][0] + vec.z * this.m[2][0], vec.x * this.m[0][1] + vec.y * this.m[1][1] + vec.z * this.m[2][1], vec.x * this.m[0][2] + vec.y * this.m[1][2] + vec.z * this.m[2][2]);
    }
    rotateX(angle) {
      const AngleInDegree = angle * Math.PI / 180;
      this.m[1][1] = this.m[2][2] = Math.cos(AngleInDegree);
      this.m[1][2] = Math.sin(AngleInDegree);
      this.m[2][1] = -this.m[1][2];
      return this;
    }
    rotateY(angle) {
      const AngleInDegree = angle * Math.PI / 180;
      this.m[0][0] = this.m[2][2] = Math.cos(AngleInDegree);
      this.m[2][0] = Math.sin(AngleInDegree);
      this.m[0][2] = -this.m[2][0];
      return this;
    }
    rotateZ(angle) {
      const AngleInDegree = angle * Math.PI / 180;
      this.m[0][0] = this.m[1][1] = Math.cos(AngleInDegree);
      this.m[0][1] = -Math.sin(AngleInDegree);
      this.m[1][0] = -this.m[0][1];
      return this;
    }
    unpack() {
      return [this.m[0][0], this.m[0][1], this.m[0][2], this.m[0][3], this.m[1][0], this.m[1][1], this.m[1][2], this.m[1][3], this.m[2][0], this.m[2][1], this.m[2][2], this.m[2][3], this.m[3][0], this.m[3][1], this.m[3][2], this.m[3][3]];
    }
    ortho(left, right, bottom, top, near, far) {
      this.m = [[2 / (right - left), 0, 0, 0], [0, 2 / (top - bottom), 0, 0], [0, 0, -2 / (far - near), 0], [-(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1]];
      return this;
    } /* End of 'MatrOrtho' function */
  }

  function matr(...arg) {
    return new _matr(...arg);
  }

  // Timer obtain current time in seconds method
  function getTime() {
    const date = new Date();
    let t = date.getMilliseconds() / 1000.0 + date.getSeconds() + date.getMinutes() * 60;
    return t;
  }
  class _timer {
    globalTime;
    localTime;
    globalDeltaTime;
    localDeltaTime;
    startTime;
    oldTime;
    oldTimeFPS;
    frameCounter;
    isPause;
    FPS;
    pauseTime;
    constructor() {
      // Fill timer global data
      this.globalTime = this.localTime = getTime();
      this.globalDeltaTime = this.localDeltaTime = 0;

      // Fill timer semi global data
      this.startTime = this.oldTime = this.oldTimeFPS = this.globalTime;
      this.frameCounter = 0;
      this.isPause = false;
      this.FPS = 30.0;
      this.pauseTime = 0;
    }
    // Timer response method
    response = (tag_id = null) => {
      let t = getTime();
      // Global time
      this.globalTime = t;
      this.globalDeltaTime = t - this.oldTime;
      // Time with pause
      if (this.isPause) {
        this.localDeltaTime = 0;
        this.pauseTime += t - this.oldTime;
      } else {
        this.localDeltaTime = this.globalDeltaTime;
        this.localTime = t - this.pauseTime - this.startTime;
      }
      // FPS
      this.frameCounter++;
      if (t - this.oldTimeFPS > 3) {
        this.FPS = this.frameCounter / (t - this.oldTimeFPS);
        this.oldTimeFPS = t;
        this.frameCounter = 0;
        if (tag_id != null) document.getElementById(tag_id).innerHTML = this.getFPS();
      }
      this.oldTime = t;
    };
    getFPS = () => this.FPS.toFixed(3);
    allToMass() {
      return [this.globalTime, this.localTime, this.globalDeltaTime, this.localDeltaTime, this.isPause];
    }
  }
  function timer(...arg) {
    return new _timer(...arg);
  }

  /* Camera module */
  class _camera {
    projSize;
    projDist;
    projFarClip;
    matrVP;
    matrView;
    matrProj;
    loc;
    at;
    dir;
    up;
    right;
    frameW;
    frameH;
    constructor(gl) {
      this.frameW = gl.drawingBufferWidth;
      this.frameH = gl.drawingBufferHeight;
      this.matrVP = matr();
      this.matrView = matr();
      this.matrProj = matr();
      this.loc = vec3();
      this.at = vec3();
      this.dir = vec3();
      this.up = vec3();
      this.right = vec3();
      this.setProj(0.5, 0.5, 100);
      this.set(vec3(2), vec3(0), vec3(0, 1, 0));
    }
    set(Loc, At, Up) {
      this.matrView.view(Loc, At, Up);
      this.matrVP.matrMulmatr(this.matrView, this.matrProj);
      this.loc = Loc;
      this.at = At;
      this.up = Up;
      this.dir.set(-this.matrView.m[0][2], -this.matrView.m[1][2], -this.matrView.m[2][2]);
      this.up.set(-this.matrView.m[0][1], -this.matrView.m[1][1], -this.matrView.m[2][1]);
      this.right.set(-this.matrView.m[0][0], -this.matrView.m[1][0], -this.matrView.m[2][0]);
    }
    setProj(ProjSize, ProjDist, ProjFarClip) {
      let rx, ry;
      rx = ry = ProjSize;
      this.projDist = ProjDist;
      this.projSize = ProjSize;
      this.projFarClip = ProjFarClip;

      /* Correct aspect ratio */
      if (this.frameW > this.frameH) rx *= this.frameW / this.frameH;else ry *= this.frameH / this.frameW;

      /* pre-calculate view matrix */
      this.matrProj.frustum(-rx / 2, rx / 2, -ry / 2, ry / 2, ProjDist, ProjFarClip);
      this.matrVP.matrMulmatr(this.matrView, this.matrProj);
    }
    setSize(FrameW, FrameH) {
      this.frameW = FrameW;
      this.frameH = FrameH;
      this.setProj(this.projSize, this.projDist, this.projFarClip);
    }
    update(input, timer) {
      let isControl = input.keys["Control"] == 1,
        isShift = input.keys["Shift"] == 1,
        speed = 10,
        time = timer.globalDeltaTime,
        Dist = vec3(this.at).sub(this.loc).len(),
        CosT = (this.loc.y - this.at.y) / Dist,
        SinT = Math.sqrt(1 - CosT * CosT),
        plen = Dist * SinT,
        CosP = (this.loc.z - this.at.z) / plen,
        SinP = (this.loc.x - this.at.x) / plen,
        Azimuth = 180 / Math.PI * Math.atan2(SinP, CosP),
        Elevator = 180 / Math.PI * Math.atan2(SinT, CosT),
        Wp = this.projSize,
        Hp = this.projSize,
        koef1 = 1,
        koef2 = 1 /*sqrt((Dist - 1) * (Dist - 1) * (Dist - 1)) / (18 * Dist)*/,
        sx = 0,
        sy = 0,
        dv = vec3();
      Azimuth += time * isControl * koef2 * -speed * ((input.mButton[0] == 1) * 500 * input.mdx / (1 + this.frameW) * 2 + (15 + 45 * isShift) * ((input.keys["ArrowLeft"] == 1) - (input.keys["ArrowRight"] == 1)));
      Elevator += time * isControl * koef2 * -speed * ((input.mButton[0] == 1) * 500 * input.mdy / (1 + this.frameH) * 2 + ((input.keys["ArrowUp"] == 1) - (input.keys["ArrowDown"] == 1)) * (15 + 10 * isShift));
      Elevator = Math.min(179.9, Elevator);
      Elevator = Math.max(0.1, Elevator);
      Dist += time * isControl * koef1 * (-input.mdz * (1 + 5 * isShift) + (8 + 25 * isShift) * ((input.keys["PageUp"] == 1) - (input.keys["PageDown"] == 1)));
      Dist = Math.max(Dist, 1.1);
      Dist = Math.min(Dist, 10 * this.projFarClip);
      if (this.frameW > this.frameH) Wp *= this.frameW / this.frameH;else Hp *= this.frameH / this.frameW;
      if (input.mButton[2] == 1 && isControl) {
        sx = input.mdx * Wp / this.frameW * Dist / this.projDist;
        sy = -input.mdy * Hp / this.frameH * Dist / this.projDist;
        dv = vec3(this.right).mul(sx).add(vec3(this.up).mul(sy));
        this.at.add(dv);
        this.loc.add(dv);
      }
      if (input.keys["KeyF"] == 1 && isControl) {
        this.set(vec3(20), vec3(0), vec3(0, 1, 0));
        return;
      }
      if (input.keys["KeyP"] == 1 && isControl) timer.isPause = !timer.isPause;
      this.set(matr().matrMulmatr(matr().rotateX(Elevator), matr().rotateY(Azimuth)).mul(matr().translate(this.at)).pointTransform(vec3(0, Dist, 0)), this.at, vec3(0, 1, 0));
    }
  }
  function camera(...arg) {
    return new _camera(...arg);
  }

  class _input {
    canva;
    mx;
    my;
    mdx;
    mdy;
    mdz; /* Wheel rotate */

    mButton = [];
    keys = [];
    keysOld = [];
    keysClick = [];
    constructor(canva) {
      this.mdx = 0;
      this.mdy = 0;
      this.mdz = 0;
      this.canva = canva;
      canva.addEventListener("wheel", this.mWheel, false);
      canva.addEventListener("mousemove", this.mMove, false);
      canva.addEventListener("mouseup", this.mUp, false);
      canva.addEventListener("mousedown", this.mDown, false);
      canva.addEventListener("contextmenu", e => e.preventDefault(), false);
      window.addEventListener("mouseup", this.mUpW, false);
      window.addEventListener("mousedown", this.mDownW, false);
      window.addEventListener("keydown", this.keyDown, false);
      window.addEventListener("keyup", this.keyUp, false);
    }
    mUpW = e => {
      this.mButton[e.button] = 0;
    };
    mDownW = e => {
      this.mButton[e.button] = 1;
    };
    mWheel = e => {
      this.mdz = e.deltaY;
      e.preventDefault();
    };
    mUp = e => {
      this.mButton[e.button] = 0;
    };
    mDown = e => {
      this.mButton[e.button] = 1;
    };
    mMove = e => {
      this.mdx = e.movementX;
      this.mdy = e.movementY;
      this.mx = e.offsetX;
      this.my = e.offsetY;
    };
    isSpecKey(key) {
      if (key === "Control" || key === "Alt" || key === "Shift") return 0;
    }
    keyDown = e => {
      if (e.altKey || e.ctrlKey || e.shiftKey) {
        this.keysOld[e.key] = 0;
        this.keys[e.key] = 1;
        if (this.keys[e.code] == 0) {
          this.keysClick[e.code] = 1, this.keysClick[e.key] = 1;
        }
      }
      this.keysOld[e.code] = 0;
      this.keys[e.code] = 1;
    };
    keyUp = e => {
      this.keys[e.key] = this.isSpecKey(e.key);
      if (this.keys[e.code] == 1) {
        this.keysClick[e.code] = 1;
        if (this.keys[e.key] != undefined) this.keysClick[e.key] = 1;
      } else this.keysClick[e.key] = 0;
      //this.keysOld[e.code] = 1;
      this.keys[e.code] = 0;
    };
    reset() {
      this.keysClick = [];
      this.mdx = this.mdy = this.mdz = 0;
    }
  }
  function input(...arg) {
    return new _input(...arg);
  }

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
        if (this.size < 48) gl.bindBufferRange(gl.UNIFORM_BUFFER, blk, this.bufId, 0, this.size);
        gl.uniformBlockBinding(prg, blk, this.bindPoint);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.bindPoint, this.bufId);
      }
    }
  }
  function buffer(...arg) {
    return new _buffer(...arg);
  }
  function ubo(...arg) {
    return new _ubo(...arg);
  }

  async function getTextFromFile(filename) {
    const res = await fetch(filename);
    const data = await res.text();
    return data;
  }

  function avtoNormal(P = null, I = null, type = "triangle") {
    if (I == null || P == null) return [];
    let n = 0;
    if (type === "triangle") n = 3;
    if (type === "triangle_strip") n = 1;
    let N = [];
    for (let i = 0; i < P.length / 3; i++) N.push(vec3(0));
    let v1, v2, v3, norm;
    for (let i = 0; i < I.length; i += n) {
      v1 = vec3(P[I[i] * 3], P[I[i] * 3 + 1], P[I[i] * 3 + 2]);
      v2 = vec3(P[I[i + 1] * 3], P[I[i + 1] * 3 + 1], P[I[i + 1] * 3 + 2]);
      v3 = vec3(P[I[i + 2] * 3], P[I[i + 2] * 3 + 1], P[I[i + 2] * 3 + 2]);
      norm = vec3(v2).sub(v1).cross(vec3(v3).sub(v1)).norm();
      N[I[i]].add(norm);
      N[I[i + 1]].add(norm);
      N[I[i + 2]].add(norm);
    }
    let Norm = [];
    for (let i = 0; i < N.length; i++) Norm.push(...N[i].norm().unpack());
    return Norm;
  }

  let admisName = [];
  admisName["P"] = ["in_pos", "Position"];
  admisName["N"] = ["in_norm", "Normal"];
  admisName["T"] = ["in_tex", "Texture"];
  admisName["C"] = ["in_color", "Color"];

  /* Primitive module */
  class _prim {
    isCreated = false;
    isDelete = false;
    isDraw = false;
    type;
    mTrans;
    mtl;
    VA;
    VB;
    IB = null;
    numOfV;
    create(gl, type, V, I, mtl = null) {
      if (type == "triangle strip") this.type = gl.TRIANGLE_STRIP;else if (type == "triangle") this.type = gl.TRIANGLES;else this.type = gl.POINTS;
      this.mtl = mtl;
      if (mtl == null || !mtl.isCreate) {
        this.error("prim have not material");
        return;
      }
      if (mtl.shd.isLoad) if (mtl.shd.isCreate == false) {
        this.error("prim have not shader");
        return;
      } else {
        this.isCreated = true;
        this.loadV(gl, V, I, mtl);
        return this;
      }
      mtl.shd.program.then(() => {
        this.isCreated = true;
        this.loadV(gl, V, I, mtl);
      });
      mtl.shd.program.catch(() => {
        this.error("prim have not shader");
        return;
      });
      return this;
    }
    loadObj(gl, filename, type, mtl) {
      return getTextFromFile(filename).then(text => {
        if (text == undefined || text == null || text == "") return;
        const data = text.replace("\r").split("\n");
        const V = [],
          I = [];
        let ilength = 0;
        for (let i = 0; i < data.length; i++) {
          if ("f " === data[i].slice(0, 2)) {
            ilength++;
          }
        }
        for (let i = 0; i < data.length; i++) {
          if ("v " === data[i].slice(0, 2)) {
            let tmp = data[i].split(" ");
            for (let j = 1; j < 4; j++) V.push(Number(tmp[j]));
          } else if ("f " === data[i].slice(0, 2)) {
            let tmp = data[i].split(" ");
            for (let j = 1; j < tmp.length; j++) {
              let ind = Number(tmp[j].split("//")[0]);
              if (ind > 0) I.push(ind - 1);else I.push(ilength + ind);
            }
          }
        }
        this.create(gl, type, {
          P: V,
          N: avtoNormal(V, I)
        }, I, mtl);
      });
    }
    draw(mTrans) {
      this.isDraw = true;
      if (mTrans == undefined || mTrans == null) {
        console.assertlog("trans matrix for draw is incorrect");
        this.mTrans = matr().identity();
      } else this.mTrans = mTrans;
    }
    del() {
      this.isDelete = true;
    }
    convert(V, mtl) {
      const Vert = [];
      const massIndex = [];
      for (let i = 0; i < mtl.vertData.length; i++) massIndex.push(0);
      let n;
      for (let i = 0; i < mtl.vertData.length; i++) {
        if (V[mtl.vertData[i][0]] != undefined && V[mtl.vertData[i][0]] != null) {
          n = V[mtl.vertData[i][0]].length / mtl.vertData[i][1];
          break;
        }
      }
      for (let i = 0; i < mtl.vertData.length; i++) if (V[mtl.vertData[i][0]] == undefined || V[mtl.vertData[i][0]] == null || V[mtl.vertData[i][0]].length === 0) {
        V[mtl.vertData[i][0]] = undefined;
        console.log("fatall error not have" + mtl.vertData[i][0] + " in mas vert");
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < massIndex.length; j++) {
        if (V[mtl.vertData[j][0]] == undefined) continue;
        for (let k = 0; k < mtl.vertData[j][1]; k++) {
          Vert.push(V[mtl.vertData[j][0]][massIndex[j]++]);
        }
      }
      return Vert;
    }
    loadV(gl, V = null, I = null, mtl) {
      if (I == undefined || I == null) {
        this.numOfV = V.length;
      } else this.numOfV = I.length;
      this.VA = gl.createVertexArray();
      gl.bindVertexArray(this.VA);
      if (typeof V[0] != "number") {
        for (let i = 0; i < mtl.vertData.length; i++) if (V[mtl.vertData[i][0]] == undefined || V[mtl.vertData[i][0]] == null || V[mtl.vertData[i][0]].length === 0) {
          console.log(`in V massive no ${mtl.vertData[i][0]}`);
          mtl.allVertDataSize -= mtl.vertData[i][1];
        }
        V = this.convert(V, mtl);
      }
      if (V != null) this.VB = buffer(gl, gl.ARRAY_BUFFER, new Float32Array(V));else {
        this.error("have V in prim creating");
        return;
      }
      if (I != null) this.IB = buffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Int16Array(I));
      let off = 0;
      for (let i = 0; i < mtl.vertData.length; i++) {
        for (let j = 0; j < admisName[mtl.vertData[i][0]].length; j++) {
          const name = admisName[mtl.vertData[i][0]][j];
          if (mtl.shd.info.attrs[name] != undefined) {
            const loc = mtl.shd.info.attrs[name].loc;
            gl.vertexAttribPointer(loc, mtl.vertData[i][1], gl.FLOAT, false, mtl.allVertDataSize * 4, off);
            off += mtl.vertData[i][1] * 4;
            gl.enableVertexAttribArray(loc);
            break;
          } else if (j == admisName[mtl.vertData[i][0]].length) console.log(`shader have ${mtl.vertData[i][0]} but material patern have`);
        }
      }
    }
    error(Buf = null) {
      this.isCreated = false;
      if (Buf != null) console.log(Buf);
    }
  }
  function prim(...arg) {
    return new _prim(...arg);
  }

  /* Shader module */
  function ShaderUploadToGL(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const Buf = gl.getShaderInfoLog(shader);
      console.log("shader is not compieled");
      console.log(Buf);
      return null;
    }
    return shader;
  }
  class _shader {
    isLoad = false;
    isCreate = false;
    pass;
    program;
    info = {
      attrs: [],
      uniforms: [],
      uniformBlocks: []
    };
    constructor(gl, allShd = null, pass) {
      this.pass = pass;
      if (allShd != null) {
        const shd = this.search(allShd, pass);
        if (shd == null) allShd.push(this);else {
          this.info = shd.info;
          this.program = shd.program;
          this.isLoad = shd.isLoad;
          this.isCreate = shd.isCreate;
          return;
        }
      }
      this.load(gl, pass);
    }
    load(gl, pass) {
      this.program = new Promise((resolve, reject) => {
        const vs = getTextFromFile(pass + "/vert.glsl");
        const fs = getTextFromFile(pass + "/frag.glsl");
        Promise.all([vs, fs]).then(res => {
          this.isLoad = true;
          let errorFlag = false,
            Buf;
          const vertexShader = ShaderUploadToGL(gl, gl.VERTEX_SHADER, res[0]);
          const fragmentShader = ShaderUploadToGL(gl, gl.FRAGMENT_SHADER, res[1]);
          if (vertexShader == null || fragmentShader == null) {
            errorFlag = true;
            Buf = "shader is not comriled";
          } else {
            this.program = gl.createProgram();
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
              Buf = gl.getProgramInfoLog(this.program);
              errorFlag = true;
            } else {
              this.getInfo(gl);
              this.isCreate = true;
              resolve(null);
            }
          }
          if (errorFlag) {
            this.isCreate = false;
            this.program = null;
            reject(Buf);
          }
        });
      });
    }
    search(allShd, pass) {
      allShd.forEach(shd => {
        if (shd.pass == pass) return shd;
      });
      return null;
    }
    apply(gl) {
      if (this.isCreate) gl.useProgram(this.program);
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
          loc: gl.getAttribLocation(this.program, info.name)
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
          loc: gl.getUniformLocation(this.program, info.name)
        };
      }
      // Fill shader uniform blocks info
      let countUniformBlocks = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORM_BLOCKS);
      for (let i = 0; i < countUniformBlocks; i++) {
        const info = gl.getActiveUniformBlockName(this.program, i);
        const idx = gl.getUniformBlockIndex(this.program, info);
        this.info.uniformBlocks[info] = {
          name: info,
          index: idx,
          size: gl.getActiveUniformBlockParameter(this.program, idx, gl.UNIFORM_BLOCK_DATA_SIZE),
          bind: gl.getActiveUniformBlockParameter(this.program, idx, gl.UNIFORM_BLOCK_BINDING),
          uIndex: gl.getActiveUniformBlockParameter(this.program, idx, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES),
          uNames: [],
          uniforms: []
        };
        this.info.uniformBlocks[info].uOffset = gl.getActiveUniforms(this.program, this.info.uniformBlocks[info].uIndex, gl.UNIFORM_OFFSET);
        for (let j = 0; j < this.info.uniformBlocks[info].uIndex.length; j++) {
          this.info.uniformBlocks[info].uniforms[j] = this.info.uniforms[gl.getActiveUniform(this.program, this.info.uniformBlocks[info].uIndex[j]).name];
        }
      }
    }
  }
  function shader(...arg) {
    return new _shader(...arg);
  }

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
        if (tex == null) allTex.push(this);else {
          this.texture = tex.texture;
          this.isCreate = tex.isCreate;
          return;
        }
      }
      if (type == "tex2d") this.load2d(gl, url);else if (type == "cube") this.loadCube(gl, url);
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
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          if (Math.log(image.width) / Math.log(2) % 1 === 0 && Math.log(image.height) / Math.log(2) % 1 === 0) {
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
      allTex.forEach(tex => {
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
      if (this.promise != undefined) this.promise.then(() => ubo.update(gl, off, new Float32Array([1])));else ubo.update(gl, off, new Float32Array([1]));
    }
  }
  function texture(...arg) {
    return new _texture(...arg);
  }

  const defTexFlagShdName = "isTex";
  const uboMtlName = "primMaterial";
  const uboPrimName = "primMatrix";

  /* GL module */
  class _material {
    gl;
    isCreate = false;
    tex = [];
    shd;
    ubo = [];
    vertData = [];
    allVertDataSize = 0;
    constructor(gl, allShd, allTex, shdPass, vertData, mtlData, texData, userUbo = null) {
      this.isCreate = true;
      this.gl = gl;

      /* shader load */
      if (typeof shdPass == "string") {
        this.shd = shader(gl, allShd, shdPass);
      } else if (typeof shdPass == "object") {
        this.shd = shdPass;
      } else {
        this.isCreate = false;
        this.shd = null;
      }

      /* Save vertex formar */
      if (vertData != null && vertData != undefined) {
        for (let i = 0; i < vertData.length - 1; i++) {
          if (vertData.at(-1)[vertData[i]] != undefined && vertData.at(-1)[vertData[i]] != null) {
            this.vertData.push([vertData[i], vertData.at(-1)[vertData[i]]]);
            this.allVertDataSize += vertData.at(-1)[vertData[i]];
          }
        }
        if (this.allVertDataSize == 0) {
          this.isCreate = false;
          this.vertData = null;
        }
      } else {
        this.isCreate = false;
        this.vertData = null;
      }

      /* load textures */
      if (texData != null && texData != undefined) {
        for (let i = 0; i < texData.length - 1; i++) {
          if (texData.at(-1)[texData[i]] != undefined && texData.at(-1)[texData[i]] != null) {
            let texMass = [texData[i]];
            let tmp = texData.at(-1)[texData[i]];
            if (typeof tmp == "string") {
              texMass.push(texture(gl, allTex, tmp));
            } else texMass.push(tmp);
            this.tex.push(texMass);
          } else console.log("no have tex in tex mass");
        }
      }
      this.ubo.push([uboPrimName, ubo(gl, 48, 0)]);
      if (userUbo != null && userUbo != undefined) {
        for (let i = 0; i < userUbo.length - 1; i++) {
          if (userUbo.at(-1)[userUbo[i]] != undefined && userUbo.at(-1)[userUbo[i]] != null) {
            this.ubo.push([userUbo[i], userUbo.at(-1)[userUbo[i]]]);
          }
        }
      }
      const loadMtlUbo = () => {
        if (this.shd.info.uniformBlocks[uboMtlName] == undefined) return;

        /* material ubo create */
        let mtlMas = [],
          texindex = [],
          texCh = 0;
        for (let i = 0; i < this.shd.info.uniformBlocks[uboMtlName].uniforms.length; i++) {
          let uniform = this.shd.info.uniformBlocks[uboMtlName].uniforms[i];
          if (mtlData != null) for (let j = 0; j < mtlData.length; j++) if (mtlData[j] === uniform.name) {
            if (typeof mtlData.at(-1)[uniform.name] == "object") mtlMas.push(...mtlData.at(-1)[uniform.name]);else mtlMas.push(mtlData.at(-1)[uniform.name]);
            uniform = null;
            break;
          }
          if (uniform == null) continue;
          for (let j = texCh; j < this.tex.length; j++) {
            if (uniform.name == defTexFlagShdName + j) {
              mtlMas.push(this.tex[j][1].isLoad);
              texindex.push([i, j]);
              texCh++;
              uniform = null;
              break;
            }
          }
          if (uniform != null) {
            if (uniform.type == gl.FLOAT_VEC3 || uniform.type == gl.INT_VEC3) for (let j = 0; j < 3; j++) mtlMas.push(-1);else if (uniform.type == gl.FLOAT || uniform.type == gl.INT) mtlMas.push(-1);
          }
        }
        if (mtlMas != undefined) {
          for (let i = 0; i != mtlMas.length % 16;) mtlMas.push(-1);
          let mtlUbo = ubo(gl, new Float32Array(mtlMas), 1);
          this.ubo.push([uboMtlName, mtlUbo]);
          for (let i = 0; i < texindex.length; i++) this.tex[texindex[i][1]][1].texFlagUpdate(gl, mtlUbo, this.shd.info.uniformBlocks[uboMtlName].uOffset[texindex[i][0]]);
        }
      };
      if (!this.isCreate) console.log("materia is not created");else {
        if (this.shd.isLoad && this.shd.isCreate) {
          loadMtlUbo();
        } else if (this.shd.isLoad && !this.shd.isCreate) {
          this.isCreate = false;
          console.log("materia is not created");
        } else {
          this.shd.program.then(() => loadMtlUbo());
          this.shd.program.catch(() => {
            this.isCreate = false;
            console.log("materia is not created");
          });
        }
      }
    }
    apply() {
      if (!this.isCreate) return;
      this.shd.apply(this.gl);
      for (let i = 0; i < this.ubo.length; i++) {
        if (this.shd.info.uniformBlocks[this.ubo[i][0]] != undefined) this.ubo[i][1].apply(this.gl, this.shd.program, this.shd.info.uniformBlocks[this.ubo[i][0]].index);
      }
      for (let i = 0; i < this.tex.length / 2; i++) if (this.shd.info.uniforms[this.tex[i][0]] != undefined) this.tex[i][1].apply(this.gl, i, this.shd.info.uniforms[this.tex[i][0]].loc);
    }
  }
  function material(...arg) {
    return new _material(...arg);
  }

  /* Render module */
  class _render {
    allPrim = [];
    allTex = [];
    allShd = [];
    gl;
    timer;
    camera;
    input;
    constructor(drawContext) {
      this.gl = drawContext.gl;
      this.camera = camera(drawContext.gl);
      this.timer = timer();
      this.input = input(drawContext.canvas);
      this.dgColorSet(1, 1, 1, 1);
    }
    dgColorSet(r, g, b, a) {
      this.gl.clearColor(r, g, b, a);
    }
    uboCreate(...arg) {
      return ubo(this.gl, ...arg);
    }
    texCreate(...arg) {
      return texture(this.gl, this.allTex, ...arg);
    }
    shdCreate(...arg) {
      return shader(this.gl, this.allShd, ...arg);
    }
    mtlCreate(...arg) {
      return material(this.gl, this.allShd, this.allTex, ...arg);
    }
    prim() {
      const pr = prim();
      this.allPrim.push(pr);
      return pr;
    }
    start() {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.timer.response("fps");
    }
    end() {
      this.camera.update(this.input, this.timer);
      this.input.reset();
      this.allPrim.forEach((prim, ind) => {
        if (prim.isDraw && !prim.isDelete && prim.isCreated) {
          this.primDraw(prim);
        } else if (prim.isDelete && prim.isCreated) {
          this.allPrim.splice(ind, 1);
        }
      });
    }
    primDraw(prim) {
      /* Matr UBO */
      prim.mtl.ubo.forEach(ubo => {
        if (ubo[0] == "primMatrix") ubo[1].update(this.gl, 0, new Float32Array([...matr().matrMulmatr(prim.mTrans, this.camera.matrVP).unpack(), ...this.camera.matrVP.unpack(), ...prim.mTrans.unpack()]));else if (ubo[0] == "time") ubo[1].update(this.gl, 0, new Float32Array([...this.timer.allToMass()]));
      });
      prim.mtl.apply();
      this.gl.bindVertexArray(prim.VA);
      if (prim.IB != null) {
        prim.IB.apply(this.gl);
        this.gl.drawElements(prim.type, prim.numOfV, this.gl.UNSIGNED_SHORT, 0);
      } else this.gl.drawArrays(prim.type, 0, prim.numOfV);
    }
  }
  function render(...arg) {
    return new _render(...arg);
  }

  function vertConvert(str) {
    let resMas = [{}, [], {}];
    const mas = str.replace(/\r\n/g, "").split("= ");
    let nameAndData,
      tmpmas = [],
      vFlag = false;
    for (let i = 0; i < mas.length; i++) {
      nameAndData = mas[i].split(" =");
      if (nameAndData.length != 2) {
        if (nameAndData[0] == "") continue;else console.log("Error parsing vert file");
      }
      if (nameAndData[0][0] == "V") vFlag = true;else if (nameAndData[0][0] == "I") {
        vFlag = false;
        tmpmas = nameAndData[1].replace(/ /g, "").split(",");
        for (let j = 0; j < tmpmas.length; j++) if (tmpmas[j] != "") resMas[1][j] = Number(tmpmas[j]);
      } else {
        if (vFlag) {
          resMas[0][nameAndData[0]] = [];
          tmpmas = nameAndData[1].replace(/ /g, "").split(",");
          for (let j = 0; j < tmpmas.length; j++) if (tmpmas[j] != "") resMas[0][nameAndData[0]][j] = Number(tmpmas[j]);
        } else {
          resMas[3] = true;
          resMas[2][nameAndData[0]] = [];
          tmpmas = nameAndData[1].split(",");
          for (let j = 0; j < tmpmas.length; j++) if (tmpmas[j] != "") resMas[2][nameAndData[0]][j] = Number(tmpmas[j]);
        }
      }
    }
    if (resMas[3] != undefined) console.log("Have any name not V I");
    return resMas;
  }

  /* Main system module */
  class _system {
    drawContext;
    render;
    constructor(id) {
      this.drawContext = glContext(id);
      this.render = render(this.drawContext);
    }
  }
  function system(...arg) {
    return new _system(...arg);
  }
  window.addEventListener("load", () => {
    let sys = system("glCanvas");
    let gl = sys.drawContext.gl;
    let uboTime = sys.render.uboCreate(16, 2);
    let mtl = sys.render.mtlCreate(".\\bin\\shaders\\3d", ["P", "N", {
      P: 3,
      N: 3
    }], ["Ka4", "Kd4", "Ks", "Ph", {
      Ka4: [0.1, 0.1, 0.1, -1],
      Kd4: [1, 1, 1, -1],
      Ks: [0.7, 0.7, 0.7],
      Ph: 40
    }], null, ["time", {
      time: uboTime
    }]);
    getTextFromFile("./coords/tetrahedron.txt").then(res => {
      let primCreateMass = vertConvert(res);
      primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
      sys.render.prim().create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl).draw(matr().translate(vec3(8, 0, 0)));
    });
    getTextFromFile("./coords/hexahedron.txt").then(res => {
      let primCreateMass = vertConvert(res);
      primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
      sys.render.prim().create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl).draw(matr().translate(vec3(6, 0, 0)));
    });
    getTextFromFile("./coords/octahedron.txt").then(res => {
      let primCreateMass = vertConvert(res);
      primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
      sys.render.prim().create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl).draw(matr().translate(vec3(4, 0, 0)));
    });
    getTextFromFile("./coords/icosahedron.txt").then(res => {
      let primCreateMass = vertConvert(res);
      primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
      sys.render.prim().create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl).draw(matr());
    });
    let prim1 = sys.render.prim();
    prim1.loadObj(gl, "./bin/model/cow.obj", "triangle", mtl).then(() => {
      prim1.draw(matr());
    }).catch(error => {
      console.log(error);
    });
    const draw = () => {
      sys.render.start();
      sys.render.end();
      window.requestAnimationFrame(draw);
    };
    draw();
  });

  exports.system = system;

  return exports;

})({});
