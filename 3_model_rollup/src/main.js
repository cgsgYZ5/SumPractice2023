import { glContext } from "./gl/gl.js";
import { render } from "./render/render.js";
import { matr } from "./math/matr.js";
import { vec3 } from "./math/vec3.js";
import { avtoNormal } from "./tools/avtonormal.js";
import { vertConvert } from "./tools/vertConvert.js";

import shd from ".\\bin\\shaders\\3d";
import tetrahedron from "./coords/tetrahedron.txt";
import hexahedron from "./coords/hexahedron.txt";
import octahedron from "./coords/octahedron.txt";
import icosahedron from "./coords/icosahedron.txt";
import cow from "./bin/model/cow.obj";
/* Main system module */
class _system {
  drawContext;
  render;

  constructor(id) {
    this.drawContext = glContext(id);
    this.render = render(this.drawContext);
  }
}

export function system(...arg) {
  return new _system(...arg);
}

window.addEventListener("load", () => {
  let sys = system("glCanvas");
  let gl = sys.drawContext.gl;
  let uboTime = sys.render.uboCreate(16, 2);
  let mtl = sys.render.mtlCreate(
    sys.render.shader().loadFromText(shd),
    ["P", "N", { P: 3, N: 3 }],
    [
      "Ka4",
      "Kd4",
      "Ks",
      "Ph",
      {
        Ka4: [0.1, 0.1, 0.1, -1],
        Kd4: [1, 1, 1, -1],
        Ks: [0.7, 0.7, 0.7],
        Ph: 40,
      },
    ],
    null,
    ["time", { time: uboTime }]
  );
  let primCreateMass;
  primCreateMass = vertConvert(tetrahedron);
  primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
  sys.render
    .prim()
    .create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl)
    .draw(matr().translate(vec3(8, 0, 0)));

  primCreateMass = vertConvert(hexahedron);
  primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
  sys.render
    .prim()
    .create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl)
    .draw(matr().translate(vec3(6, 0, 0)));

  primCreateMass = vertConvert(octahedron);
  primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
  sys.render
    .prim()
    .create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl)
    .draw(matr().translate(vec3(4, 0, 0)));

  primCreateMass = vertConvert(icosahedron);
  primCreateMass[0]["N"] = avtoNormal(primCreateMass[0].P, primCreateMass[1]);
  sys.render
    .prim()
    .create(gl, "triangle", primCreateMass[0], primCreateMass[1], mtl)
    .draw(matr());

  let prim1 = sys.render.prim();
  prim1
    .loadObjFromText(gl, cow, "triangle", mtl)
    .then(() => {
      prim1.draw(matr());
    })
    .catch((error) => {
      console.log(error);
    });

  const draw = () => {
    sys.render.start();

    sys.render.end();

    window.requestAnimationFrame(draw);
  };
  draw();
});
