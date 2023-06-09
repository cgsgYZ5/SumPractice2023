import { parser } from "./../../tools/parser.js";
/* GL module */
class _materialPat {
  name;

  vForm;
  vFormAllSize;

  mForm;
  mFormAllSize;

  shdPass;
  noofTex;

  constructor(vForm, mForm, shdPass, noofTex) {
    this.shdPass = shdPass;
    this.noofTex = noofTex;

    this.vForm = parser(vForm);
    for (
      let i = 0;
      i < this.vForm.len && this.vForm.args[i].size != undefined;
      i++
    )
      this.vFormAllSize = this.vForm.args[i].size;
    this.mForm = parser(mForm);
    for (
      let i = 0;
      i < this.mForm.len && this.mForm.args[i].size != undefined;
      i++
    )
      this.mFormAllSize = this.mForm.args[i].size;
  }
}

export function materialPat(...arg) {
  return new _materialPat(...arg);
}
