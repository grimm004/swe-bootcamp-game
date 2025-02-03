precision highp float;

uniform vec4 uColour;

varying vec4 vColour;

void main() {
    gl_FragColor = vColour * uColour;
}