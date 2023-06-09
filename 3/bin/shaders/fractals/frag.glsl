#version 300 es
precision highp float;
out vec4 out_color;

uniform float Time;
uniform vec2 Md;
in vec3 vertex_pos;


vec2 CmplSet( float A, float B )
{
    vec2 Z;
    Z.x = A;
    Z.y = B;
    return Z;
}

vec2 CmplAddCmpl( vec2 Z1, vec2 Z2 )
{
    vec2 Z;
    Z.x = Z1.x + Z2.x;
    Z.y = Z1.y + Z2.y;
    return Z;
}

vec2 CmplMulCmpl( vec2 Z1, vec2 Z2 )
{
    vec2 Z;
    Z.x = Z1.x * Z2.x - Z1.y * Z2.y;
    Z.y = Z1.x * Z2.y + Z1.y * Z2.x;
    return Z;
}

float CmplNorm2( vec2 Z )
{
    float N = Z.x * Z.x + Z.y * Z.y;
    return N;
}

float Mondelbrod( vec2 Z, vec2 Y )
{
    float n = 1.0;
    
    while (CmplNorm2(Z) < 4.0 && n < 256.0)
        Z = CmplAddCmpl(CmplMulCmpl(Z, Z), Y), n += 1.0;
    return n / 256.0;
}

float Julia( vec2 Z, vec2 C )
{
    float n = 1.0;

    while (CmplNorm2(Z) < 2.0 && n < 256.0)
        Z = CmplAddCmpl(CmplMulCmpl(Z, Z), C), n += 1.0;
    return n / 2.0 / 256.0;
}

vec4 f( vec2 a )
{
    float n;
    vec2 cmpl1, cmpl2;

    cmpl1.x = 0.35 + 0.7 * sin(Time + 3.0);
    cmpl1.y = 0.39 + 0.7 * sin(1.1 * Time);

    cmpl2.x = a.x;
    cmpl2.y = a.y;

    n = Julia(cmpl2, cmpl1);  
    //n = Mondelbrod(cmpl2, cmpl2);    
    return vec4(n, n, n, 1);
}

void main(){

    out_color = f(vertex_pos.xy);
    out_color = vec4(1, 0.67, 0.4, 1);
}