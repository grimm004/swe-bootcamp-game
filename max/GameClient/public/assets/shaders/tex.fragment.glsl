precision highp float;

uniform sampler2D uSampler;

varying vec2 vTextureCoords;

void main() {
    gl_FragColor = texture2D(uSampler, vec2(vTextureCoords.x, 1.0 - vTextureCoords.y));
}