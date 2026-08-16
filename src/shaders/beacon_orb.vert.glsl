varying vec3 vLocalPosition;
varying vec3 vCameraLocalPos;

uniform vec3 uCameraWorldPos;

void main() {
    vLocalPosition = position;
    vCameraLocalPos = (inverse(modelViewMatrix) * vec4(uCameraWorldPos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}