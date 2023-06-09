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
    canva.addEventListener("contextmenu", (e) => e.preventDefault(), false);

    window.addEventListener("mouseup", this.mUpW, false);
    window.addEventListener("mousedown", this.mDownW, false);
    window.addEventListener("keydown", this.keyDown, false);
    window.addEventListener("keyup", this.keyUp, false);
  }

  mUpW = (e) => {
    this.mButton[e.button] = 0;
  };
  mDownW = (e) => {
    this.mButton[e.button] = 1;
  };

  mWheel = (e) => {
    this.mdz = e.deltaY;
    e.preventDefault();
  };
  mUp = (e) => {
    this.mButton[e.button] = 0;
  };
  mDown = (e) => {
    this.mButton[e.button] = 1;
  };
  mMove = (e) => {
    this.mdx = e.movementX;
    this.mdy = e.movementY;
    this.mx = e.offsetX;
    this.my = e.offsetY;
  };
  isSpecKey(key) {
    if (key === "Control" || key === "Alt" || key === "Shift") return 0;
  }

  keyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.shiftKey) {
      this.keysOld[e.key] = 0;
      this.keys[e.key] = 1;
      if (this.keys[e.code] == 0) {
        (this.keysClick[e.code] = 1), (this.keysClick[e.key] = 1);
      }
    }
    this.keysOld[e.code] = 0;
    this.keys[e.code] = 1;
  };
  keyUp = (e) => {
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

export function input(...arg) {
  return new _input(...arg);
}
