#include <fog_pars_fragment>

uniform vec3 terrainColor;


void main() {
    gl_FragColor = vec4(terrainColor, 1.0);

    #include <fog_fragment>
}