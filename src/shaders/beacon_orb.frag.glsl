uniform float uTimeSeconds;
uniform vec3 uPrimaryColor;
uniform int uShapeID;

varying vec3 vCameraLocalPos;
varying vec3 vLocalPosition;

struct MarchData {
    int iterations;
    float cd;
    float d;
    float trap;
};

struct SDOutput {
    float dist;
    float trap;
};

float sdSphere( vec3 p, float r )
{
  return length(p) - r;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// Computes a scalar trap signal from the current iterate z
float trapDistance(vec3 z, int trapMode) {
    float trap = 0.0;
    if      (trapMode == 0) trap = abs(z.y);             // Plane trap (Y=0)
    else if (trapMode == 1) trap = abs(length(z) - 1.0); // Spherical shell (r=1)
    else if (trapMode == 2) trap = length(z.xy);         // Axis trap (distance to Z axis)
    else if (trapMode == 3) trap = max(max(abs(z.x), abs(z.y)), abs(z.z)); // Cube trap
    return trap;
}

mat4 rotation4D(int i, int j, float angle)
{
    mat4 m = mat4(1.0);

    float c = cos(angle);
    float s = sin(angle);

    m[i][i] = c;
    m[j][j] = c;

    m[i][j] = -s;
    m[j][i] =  s;

    return m;
}

SDOutput sdCube4D(vec4 p, float s)
{
    vec4 d = abs(p) - s;
    float dist = length(max(d, 0.0)) + min(max(max(d.x, d.y), max(d.z, d.w)), 0.0);
    return SDOutput(dist, 0.0);
}

SDOutput sdMandelbulb(vec3 p, float power, float rotSpeed) {
    vec3 rotationAxis = vec3(0, 1, 0);
    vec3 z = p;
    float dr = 1.0;
    float r = 0.0;
    float time = uTimeSeconds * rotSpeed;

    // Define rotation matrix using time
    mat3 rotation = mat3(
        cos(time), 0, sin(time),
        0, 1, 0,
        -sin(time), 0, cos(time)
    );

    // Rotate point by applying rotation matrix
    z = rotation * z;

    float trap = 1e6;
    for (int i = 0; i < 6; i++) {
        r = length(z);

        trap = min(trap, trapDistance(z, 2));
        if (r > 2.0) break;

        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;

        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;

        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += p;

        // Rotate point again after each iteration
        z = rotation * z;
    }

    return SDOutput(0.5 * log(r) * r / dr, trap);
}

SDOutput sd16Cell(vec4 p, float s)
{
    p = abs(p);
    SDOutput sdOut = SDOutput((p.x + p.y + p.z + p.w - s)* 0.57735027, 0.0);
    return sdOut;
}

SDOutput sd5Cell(vec4 p, vec4 a)
{
    float dist = (max(max(max( abs(p.x+p.y+(p.w/a.w))-p.z,abs(p.x-p.y+(p.w/a.w))+p.z), abs(p.x - p.y - (p.w/a.w))+p.z),abs(p.x+p.y-(p.w/a.w))-p.z)-a.x)/sqrt(3.0);
    return SDOutput(dist, 0.0);
}

SDOutput mandelboxDE(vec3 p)
{
    vec3 z = p;
    float dr = 1.0;
    const float scale = 2.0;

    float trap = 1e6;

    for (int i = 0; i < 15; i++)
    {
        // Box fold
        z = clamp(z, -1.0, 1.0) * 2.0 - z;

        // Sphere fold
        float r2 = dot(z, z);

        if (r2 < 0.25)
        {
            z *= 4.0;
            dr *= 4.0;
        }
        else if (r2 < 1.0)
        {
            float k = 1.0 / r2;
            z *= k;
            dr *= k;
        }

        trap = min(trap, trapDistance(z, 3));
        // Scale + translate
        z = scale * z + p;

        dr = abs(scale) * dr + 1.0;
    }

    float r = length(z);
    float dist = r / abs(dr);
    SDOutput sdOut = SDOutput(dist, trap);
    return sdOut;
}

SDOutput mandelbulbScene(vec3 p) {
    float scale = 3.0;
    SDOutput sdOut = sdMandelbulb(p / scale, 6.0, 1.0);
    return SDOutput(sdOut.dist * scale, sdOut.trap);
}

SDOutput hypercubeScene(vec3 p) {
    float angle = uTimeSeconds * 1.0;
    mat4 rotation = rotation4D(0, 3, angle * 1.1);
    rotation *= rotation4D(2, 1, angle * 0.8);
    rotation *= rotation4D(1, 0, angle * 0.7);
    rotation *= rotation4D(3, 1, angle * 1.1);
    rotation *= rotation4D(2, 3, angle);
    vec4 p4 = vec4(p, 0.0);
    SDOutput hypercube = sdCube4D(rotation * p4, 1.0);
    return hypercube;
}

SDOutput thirdScene(vec3 p) {
    float angle = uTimeSeconds * 1.0;
    mat4 rotation = rotation4D(0, 3, angle * 1.1);
    rotation *= rotation4D(2, 1, angle * 0.8);
    rotation *= rotation4D(1, 0, angle * 0.7);
    rotation *= rotation4D(3, 1, angle * 1.1);
    rotation *= rotation4D(2, 3, angle);
    vec4 p4 = vec4(p, 0.0);
    SDOutput sixteenCell = sd16Cell(rotation * p4, 1.0);
    return sixteenCell;
}

SDOutput fourthScene(vec3 p) {
    float angle = uTimeSeconds * 1.0;
    mat4 rotation = rotation4D(0, 3, angle * 1.1);
    rotation *= rotation4D(2, 1, angle * 0.8);
    rotation *= rotation4D(1, 0, angle * 0.7);
    rotation *= rotation4D(3, 1, angle * 1.1);
    rotation *= rotation4D(2, 3, angle);
    vec4 p4 = vec4(p, 0.0);
    SDOutput fiveCell = sd5Cell(rotation * p4, vec4(1.0));
    return fiveCell;
}

SDOutput fifthScene(vec3 p) {
    float angle = uTimeSeconds;

    mat3 rotation = mat3(
        cos(angle), 0.0, sin(angle),
        0.0, 1.0, 0.0,
       -sin(angle), 0.0, cos(angle)
    );

    p = rotation * p;

    const float scale = 0.25;
    SDOutput mandelbox = mandelboxDE(p / scale);
    mandelbox.dist *= scale;
    return mandelbox;
}

SDOutput mapScene(vec3 p) {
    switch (uShapeID) {
        case 0:
            return mandelbulbScene(p);
        case 1:
            return hypercubeScene(p);
        case 2:
            return thirdScene(p);
        case 3:
            return fourthScene(p);
        case 4:
            return fifthScene(p);
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
    switch (uShapeID) {
        case 0: {
            float trap = smoothstep(0.0, 1.0, data.trap * 1.0);
            vec3 col = palette(trap);
            return col;
        }
        case 1: {
            vec3 col = palette(float(data.iterations) * 1e-3);
            return col;
        }
        case 2: {
            vec3 col = palette(float(data.iterations) * 1e-3);
            return col;
        }
        case 3: {
            vec3 col = palette(float(data.iterations) * 1e-3);
            return col;
        }
        case 4: {
            float trap = smoothstep(0.0, 1.0, data.trap * 0.5);
            vec3 col = palette(trap);
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
}