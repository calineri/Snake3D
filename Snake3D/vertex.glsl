precision highp float;

// Posicao do Vertice
attribute vec3 position;

// Posicao do Vertice em relacao a camera
varying vec4 vertexPos;

// fovy, aspect, near, far
uniform mat4 projection;

// eye, up, center/lookAt
uniform mat4 view;

// posicao, rotacao, escala do modelo (world)
uniform mat4 model;

void main(){
    vertexPos = view * model * vec4(position, 1.0);
    gl_Position = projection * vertexPos;
}