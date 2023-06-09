import * as a from "/new_module.js";

newmodule = require("./new_module.js");
minimist = require("minimist");

function func() {
  console.log("func");
}

console.log("CGSG");
func();
console.log("CGSG");
console.log("CGSG");

const obj = {
  a: 20,
  b: 34,
};

const obj2 = { ...obj };

class Class1 {
  static generalId = 0;
  constructor() {
    this.a = 1;
    this.b = 10;
    this.Id = Class1.generalId;
    Class1.generalId += 1;
  }

  methodArraw = () => {
    console.log(this.Id);
  };
}

let objClass1 = new Class1();
objClass1.methodArraw();
