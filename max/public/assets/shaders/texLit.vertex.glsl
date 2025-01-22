precision highp float;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoords;

varying vec2 vTextureCoords;
varying vec3 vPosition;
varying vec3 vNormal;

void main()
{
    vec4 modelVertex = uModelMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * uViewMatrix * modelVertex;
    vPosition = vec3(modelVertex);
    vNormal = vec3(uModelMatrix * vec4(aVertexNormal, 0.0));
    vTextureCoords = aTextureCoords;
}