import { vec3 } from "../math/vec3.js";

export function avtoNormal(P = null, I = null, type = "triangle") {
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
