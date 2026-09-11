#include <formulas>
#include <fog_pars_fragment>

const int EProjectID_CONIFER_INIT = 0;
const int EProjectID_ICONS_CREATOR = 1;
const int EProjectID_REALITY_GRID = 2;
const int EProjectID_DOTS_KILLER = 3;
const int EProjectID_GENESIS_CONSTRUCTA = 4;

uniform float uTimeSeconds;
uniform vec3 uPrimaryColor;
uniform int uProjectNumber;

varying vec3 vCameraLocalPos;
varying vec3 vLocalPosition;

struct MarchData {
    int iterations;
    float cd;
    float d;
    float trap;
};

SDOutput mandelbulbScene(vec3 p) {
    float scale = 3.0;
    SDOutput final = sdMandelbulb(p / scale, 6.0, uTimeSeconds);
    return final;
}

SDOutput hypercubeScene(vec3 p) {
    float angle = uTimeSeconds * 1.0;
    mat4 rotation = rotation4D(0, 3, angle * 1.1);
    rotation *= rotation4D(2, 1, angle * 0.8);
    rotation *= rotation4D(1, 0, angle * 0.7);
    rotation *= rotation4D(3, 1, angle * 1.1);
    rotation *= rotation4D(2, 3, angle);
    vec4 p4 = vec4(p, 0.0);

    mat3 rotation3 = rotation3D(2, 1, angle * 0.8);
    rotation3 *= rotation3D(1, 0, angle * 0.7);

    float frame = sdBoxFrame(rotation3 * p, vec3(2.0), 0.05);
    float frame2 = sdBoxFrame(inverse(rotation3) * p, vec3(1.5), 0.05);
    float frames = opUnion(frame, frame2);
    SDOutput hypercube = sdCube4D(rotation * p4, 1.0);
    float finalDist = opUnion(hypercube.dist, frames);
    SDOutput final = SDOutput(finalDist, 0.0);
    return final;
}

SDOutput quaternionJuliaScene(vec3 p) {
    float angle = uTimeSeconds * 1.0;
    mat4 rotation = rotation4D(0, 3, angle * 1.1);
    rotation *= rotation4D(2, 1, angle * 0.8);
    rotation *= rotation4D(1, 0, angle * 0.7);
    rotation *= rotation4D(3, 1, angle * 1.1);
    rotation *= rotation4D(2, 3, angle);
    vec4 p4 = vec4(p, sin(uTimeSeconds * 0.15));
    vec4 c = vec4(
        -0.4, 
        0.65 + 0.05 * -sin(uTimeSeconds * 0.3), 
        0.1 * cos(uTimeSeconds * 0.05), 
        0.2 * sin(uTimeSeconds * 0.03)
    );
    const float scale = 6.0;
    SDOutput julia = sdQuaternionJulia((rotation * p4) / scale, c);
    julia.dist *= scale;

    mat3 rotation3 = rotation3D(2, 1, angle * 0.8);
    rotation3 *= rotation3D(1, 0, angle * 0.7);
    float cube = sdBox(inverse(rotation3) * p, vec3(2.0));

    SDOutput final = SDOutput(opIntersection(cube, julia.dist), julia.trap);
    return final;
}

SDOutput mandelboxScene(vec3 p) {
    float angle = uTimeSeconds;
    
    mat3 rotation = rotation3D(2, 1, angle * 0.8);
    rotation *= rotation3D(1, 0, angle * 0.7);
    const float scale = 0.45;
    SDOutput mandelbox = sdMandelbox((rotation * p) / scale);
    mandelbox.dist *= scale;

    mat4 rotation4 = rotation4D(0, 3, angle * 1.1);
    rotation4 *= rotation4D(2, 1, angle * 0.8);
    rotation4 *= rotation4D(1, 0, angle * 0.7);
    rotation4 *= rotation4D(3, 1, angle * 1.1);
    rotation4 *= rotation4D(2, 3, angle);
    SDOutput filterShape = sd24Cell(rotation4 * vec4(p, 0.0), 3.0);

    SDOutput final = SDOutput(opIntersection(mandelbox.dist, filterShape.dist), mandelbox.trap);
    return final;
}

SDOutput twentyFourCellScene(vec3 p) {
    float angle = uTimeSeconds * 1.0;
    mat4 rotation = rotation4D(0, 3, angle * 1.1);
    rotation *= rotation4D(2, 1, angle * 0.8);
    rotation *= rotation4D(1, 0, angle * 0.7);
    rotation *= rotation4D(3, 1, angle * 1.1);
    rotation *= rotation4D(2, 3, angle);
    vec4 p4 = vec4(p, 0.0);

    mat3 rotation3 = rotation3D(2, 1, angle * 0.8);
    rotation3 *= rotation3D(1, 0, angle * 0.7);

    SDOutput shape = sd24Cell(rotation * p4, 1.5);
    float frame = sdBoxFrame(inverse(rotation3) * p, vec3(2.0), 0.1);
    float frame2 = sdBoxFrame(rotation3 * p, vec3(1.5), 0.1);
    float frames = opUnion(frame, frame2);
    float finalDist = opUnion(shape.dist, frames);
    SDOutput final = SDOutput(finalDist, 0.0);
    return final;
}

SDOutput mapScene(vec3 p) {
    switch (uProjectNumber) {
        case EProjectID_CONIFER_INIT:
            return mandelbulbScene(p);
        case EProjectID_ICONS_CREATOR:
            return hypercubeScene(p);
        case EProjectID_REALITY_GRID:
            return quaternionJuliaScene(p);
        case EProjectID_DOTS_KILLER:
            return mandelboxScene(p);
        case EProjectID_GENESIS_CONSTRUCTA:
            return twentyFourCellScene(p);
        default:
            return SDOutput(0.0, 0.0);
    }
}

MarchData march(vec3 ro, vec3 rd) {
    float d = 0.0;
    float cd;
    vec3 p;

    float scale = 3.0;
    float trap = 0.0;
    int maxSteps = 800;
    float maxDistance = 1000.0;
    int i;
    for (i = 0; i < maxSteps; i++) {
        p = ro + d * rd;
        SDOutput res = mapScene(p);
        cd = res.dist;

        if (cd < 0.0001) {
            trap = res.trap;
            break;
        }

        d += cd;

        if (d >= maxDistance) {
            trap = res.trap;
            break;
        }
    }

    MarchData marchData = MarchData(i, cd, d, trap);

    return marchData;
}

vec3 palette( float t ) {
    vec3 a = uPrimaryColor; // baseline
    vec3 b = vec3(0.5); // amplitude
    vec3 c = vec3(1.5); // frequency
    vec3 d = vec3(0.0, 0.1, 0.2); // phase
    return a + b * cos(6.283185 * (c * t + d));
}

vec3 colorScene(MarchData data) {
    switch (uProjectNumber) {
        case EProjectID_CONIFER_INIT: {
            float trap = smoothstep(0.0, 1.0, data.trap * 1.0);
            vec3 col = palette(trap);
            return col;
        }
        case EProjectID_ICONS_CREATOR: {
            vec3 col = palette(float(data.iterations) * 1e-2);
            return col;
        }
        case EProjectID_REALITY_GRID: {
            float trap = smoothstep(0.0, 1.0, data.trap * 3.0);
            vec3 col = palette(trap);
            return col;
        }
        case EProjectID_DOTS_KILLER: {
            float trap = smoothstep(0.0, 1.0, data.trap * 0.5);
            vec3 col = palette(trap);
            return col;
        }
        case EProjectID_GENESIS_CONSTRUCTA: {
            vec3 col = palette(float(data.iterations) * 1e-2);
            return col;
        }
        default: {
            return vec3(1.0, 0.0, 1.0);
        }
    }
}

void main() {
    vec3 ro = vLocalPosition;
    vec3 rd = normalize(vLocalPosition - vCameraLocalPos);

    MarchData marchData = march(ro, rd);
    float dist = marchData.d;
    if (dist > 1000.0) {
       discard;
    }

    vec3 col = colorScene(marchData);
    gl_FragColor = vec4(col, 1.0);

    #include <fog_fragment>
}