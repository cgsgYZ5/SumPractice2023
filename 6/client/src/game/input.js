keys = [];
keysOld = [];
keysClick = [];

const keyDown = (e) => {
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

const keyUp = (e) => {
  this.keys[e.key] = this.isSpecKey(e.key);
  if (this.keys[e.code] == 1) {
    this.keysClick[e.code] = 1;
    if (this.keys[e.key] != undefined) this.keysClick[e.key] = 1;
  } else this.keysClick[e.key] = 0;
  //this.keysOld[e.code] = 1;
  this.keys[e.code] = 0;
};
window.addEventListener("keydown", keyDown, false);
window.addEventListener("keyup", keyUp, false);
