(function () {
  'use strict';

  function funcSum(a, b) {
    return a + b;
  }

  var vert = "#version 300 es\n#define GLSLIFY 1\nin vec3 in_pos;void main(void){gl_Position=vec4(in_pos,1);}"; // eslint-disable-line

  var person = {
  	name: "ivnirnv"
  };
  var person$1 = {
  	person: person
  };

  let a = 30;
  // const b = 0;

  console.log(funcSum(a, 12));
  console.log(vert);
  console.log(person$1);

})();
