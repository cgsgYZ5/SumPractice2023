#version 300 es

in vec3 in_pos;

void main(void) {
    gl_Position = vec4(in_pos, 1);
}