precision highp float;

uniform sampler2D uSampler;
uniform vec3 uAmbientColour;
uniform vec3 uLightColour;
uniform vec3 uLightPosition;
uniform vec3 uEyePosition;

varying vec2 vTextureCoords;
varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    vec3 nNorm = normalize(vNormal);
    vec3 lightVector = uLightPosition - vPosition;
    vec3 normLightVector = normalize(lightVector);
    vec3 eyeVector = normalize(uEyePosition - vPosition);

    // Diffuse
    float diffuse = clamp(dot(normLightVector, nNorm), 0.0, 1.0);

    // Specular
    vec3 reflectedLightVector = reflect(-normLightVector, nNorm);
    float specularity = clamp(dot(reflectedLightVector, eyeVector), 0.0, 1.0);
    specularity *= specularity;
    specularity *= specularity;
    specularity *= specularity;

    const float a = 0.0, b = 0.05;

    float lightDistance = length(lightVector);
    float dropoff = 1.0 / (1.0 + (a * lightDistance) + (b * lightDistance * lightDistance));

    // Ambient, Diffuse and Specular
    vec3 lightColour = uAmbientColour + ((diffuse + specularity) * uLightColour);
    lightColour *= dropoff;

    // Ambient, Diffuse, Specular, Colour and Texture
    gl_FragColor = vec4(lightColour * texture2D(uSampler, vec2(vTextureCoords.x, 1.0 - vTextureCoords.y)).xyz, 1.0);

    //gl_FragColor = vec4(lightColour, 1.0);
}