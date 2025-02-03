precision highp float;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

attribute vec4 aVertexPosition;
attribute vec4 aVertexColour;

varying vec4 vColour;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
    vColour = aVertexColour;
}