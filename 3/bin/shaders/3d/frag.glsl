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
  float isTex1;
  float isTex2;
  // float isTex3;
  // float isTex4;
  // float isTex5;
};

#define Ka Ka4.rgb
#define Kd Kd4.rgb
// #define Ks Ks4.rgb
// #define Ph Ks4.a

out vec4 out_color;
in vec2 TexCoords;
in vec3 DrawPos;
in vec4 DrawColor;
in vec3 DrawNormal;
/*
in vec2 TexCoord;  
in vec3 DrawNormal;

*/
vec3 Shade(vec3 P, vec3 N, vec3 LightPos) {
  vec3 L = normalize(vec3(-1.0, 0, 0));
  vec3 LC = vec3(0.15f, 0.64f, 0.15f);
  vec3 color = vec3(0);
  vec3 V = normalize(P - LightPos);

  // Ambient
  color = Ka;
  //return N;
  //return V + N;
  //N = faceforward(N, V, N);

  vec3 diff = Ka;
  // if(isTex1 == 1.) {
  //   vec4 tc = texture(uSampler1, TexCoord);
  //   diff += tc.rgb;
  // }
  // Diffuse
  color += max(0.0, dot(N, L)) * Kd * LC;

  // Specular
  vec3 R = reflect(-L, N);
  //return pow(max(0.0, dot(R, L)), Ph) * Ks * LC;
  // return (pow(max(0.0, dot(R, L)), Ph) * Ks * LC);
  //return color;
  color += pow(max(0.0, dot(R, L)), Ph) * Ks * LC;

  return color;
}

void main(void) {

  out_color = vec4(1, 0.6, 0, 1);

  // col = texture(uSampler1, TexCoords.xy * 2.0).rgb;
  // col = texture(uSampler2, vec2(TexCoords.x, TexCoords.y * 2.0 - 1.0)).rgb;

  vec3 col = vec3(0.4, 0.6, 0.1);
  if(isTex1 == 1.) {
    if(TexCoords.x < 0.5 && TexCoords.y < 0.5)
      col = texture(uSampler1, TexCoords.xy * 2.0).rgb;
    else if(TexCoords.x > 0.5 && TexCoords.y > 0.5)
      col = texture(uSampler1, (TexCoords - 0.5) * 2.0).rgb;
  }
  if(isTex2 == 1.) {
    if(TexCoords.x < 0.5 && TexCoords.y > 0.5) {
      col = texture(uSampler2, vec2(TexCoords.x, TexCoords.y * 2.0 - 1.0)).rgb;
    } else if(TexCoords.x > 0.5 && TexCoords.y < 0.5)
      col = texture(uSampler2, vec2(TexCoords.x * 2.0 - 1.0, TexCoords.y)).rgb;
  }
  if(isTex1 == -1. && isTex2 == -1.) {
    // out_color = vec4(DrawNormal, 1);
    // out_color = vec4(DrawNormal, 1);
    out_color = vec4(Shade(DrawPos, DrawNormal, vec3(2, 0, 0)), 1);

    //out_color = vec4(Ph, Ph, Ph, 1);
  } else
    out_color = vec4(1, 1, 1, 1);
  //
  //out_color = vec4(DrawNormal, 1);

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