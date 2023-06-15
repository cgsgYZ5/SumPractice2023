#version 300 es
/**/
precision highp float;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;

uniform primMaterial {
  vec4 Ka4;
  vec4 Kd4;
  vec3 Ks;
  float Ph;
  float IsTex0, isTex1;
};
uniform time {
  float globalTime, localTime, globalDeltaTime, localDeltaTime, isPause;
};
uniform camera {
//   float projSize,
//   projDist,
//   projFarClip;
// mat4 matrVP,
//   matrView,
//   matrProj;
  vec3 loc;
//   at,
//   dir,
//   up,
//   right;
// float   frameW,
//   frameH;
};
#define Ka Ka4.rgb
#define Kd Kd4.rgb

out vec4 out_color;
in vec2 TexCoords;
in vec3 DrawPos;
in vec4 DrawColor;
in vec3 DrawNormal;
/*
in vec2 TexCoord;  
in vec3 DrawNormal;

*/
vec3 shade() {
  vec3 L = normalize(vec3(5.0 * sin(localTime), 5, 5.0 * cos(localTime)));
  vec3 LC = vec3(0.1, 0.2, 0.7);
  vec3 V = normalize(DrawPos - loc);
  vec3 N = DrawNormal;//vec3(0, 1, 0);
    //N = faceforward(N, V, N);
  return vec3(min(vec3(0.1), Ka) +
    max(0.05, dot(N, L)) * Kd * LC +
    pow(max(0.05, dot(reflect(V, N), L)), Ph) * Ks * LC);
}
void main(void) {
  out_color = vec4(1, 0.6, 0, 1);

  // col = texture(uSampler1, TexCoords.xy * 2.0).rgb;
  // col = texture(uSampler2, vec2(TexCoords.x, TexCoords.y * 2.0 - 1.0)).rgb;

  vec3 col;
  if(IsTex0 == 1.)
    if(TexCoords.x < 0.5 && TexCoords.y < 0.5)
      col = texture(uSampler1, TexCoords.xy * 2.0).rgb;
    else if(TexCoords.x > 0.5 && TexCoords.y > 0.5)
      col = texture(uSampler1, (TexCoords - 0.5) * 2.0).rgb;

  if(isTex1 == 1.)
    if(TexCoords.x < 0.5 && TexCoords.y > 0.5) {
      col = texture(uSampler2, vec2(TexCoords.x, TexCoords.y * 2.0 - 1.0)).rgb;
    } else
      col = texture(uSampler2, vec2(TexCoords.x * 2.0 - 1.0, TexCoords.y)).rgb;
  out_color = vec4(col, 1);

  if(IsTex0 == -1. && isTex1 == -1.) {
    vec3 L = normalize(-vec3(cos(localTime), 1, sin(localTime)));
    vec3 LC = vec3(1, 1, 1);
    vec3 V = normalize(DrawPos - 3. * vec3(cos(localTime), 1, sin(localTime)));
    vec3 N = DrawNormal;
    //vec3 N = faceforward(DrawNormal, V, -DrawNormal);

  // color += max(0, dot(N, L)) * Kd * LC;

  //     // Specular
    vec3 R = reflect(V, N);

    vec3 a = max(0.1, dot(N, L)) * Kd * LC + pow(max(0.1, dot(R, L)), Ph) * Ks * LC;

    col = Ka + a;

    out_color = vec4(col, 1);
  }
  col = shade();
  out_color = vec4(pow(col.x, 1. / 2.2), pow(col.y, 1. / 2.2), pow(col.z, 1. / 2.2), 1);
  //out_color = vec4(col, 1);
  //out_color = vec4(DrawPos, 1);

    /*
  if (IsTexture0)
    OutColor = vec4(texture(InTextures[0], TexCoord).rgb, 1);

  OutPosId = vec4(DrawPos, 1);
  OutKsPh = KsPh;             
  OutKaTrans = KaTrans;       

  OutKdDepth = vec4(MtlKd, DrawPos.z);      
  OutNormalIsShade = vec4(normalize(DrawNormal), 1);
  */
}
