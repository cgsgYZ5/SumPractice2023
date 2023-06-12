#version 300 es
/**/
precision highp float;

in vec3 in_pos;
in vec3 in_norm;
//in vec3 in_norm;
in vec2 in_tex;
out vec3 DrawPos;
out vec2 TexCoords;
out vec3 DrawNormal;
/*
uniform atrix
{
    mat4 WVP;
    mat4 VP;
    mat4 W;
};
*/
out vec4 DrawColor;
uniform primMatrix {
  mat4 WVP;
  mat4 VP;
  mat4 W;
};
/*
uniform material {
  mat4 WVP;
  mat4 VP;
  mat4 W;
};
 
/* 
out vec2 TexCoord;  


*/
void main(void) {
  //gl_Position = vec4((VP * in_pos).xyz, 1);
  gl_Position = WVP * vec4(in_pos, 1);
  DrawColor = vec4(WVP[0].x, WVP[0].x, WVP[0].x, WVP[0].x);
  DrawPos = vec3(W * vec4(in_pos, 1));
  DrawNormal = vec3(transpose(inverse(W)) * vec4(in_norm, 1));
                     //TexCoords = in_tex;
  TexCoords = in_tex;
  //DrawNormal = in_norm;
  //DrawColor = vec4(0.78, 0.2, 1, 1);
  /*
  DrawNormal = (MatrWInv * vec4(InNormal, 1)).rgb;
  TexCoord = InTexCoord;
  DrawColor = InColor;
  */
}
