float opSmoothUnion( float a, float b, float k ) {
    k *= 4.0;
    float h = max(k-abs(a-b),0.0);
    return min(a, b) - h*h*0.25/k;
}

float opSmoothSubtraction( float a, float b, float k ) {
    return -opSmoothUnion(a,-b,k);
}

float opUnion( float a, float b ) {
    return min(a,b);
}

float opSubtraction( float a, float b ) {
    return max(-a,b);
}

float opIntersection( float a, float b ) {
    return max(a,b);
}

float opXor( float a, float b ) {
    return max(min(a,b),-max(a,b));
}

// For i or j:
//     0 - x axis
//     1 - y axis
//     2 - z axis
//     3 - w axis
// ij represents a plane on which the rotation happens.
mat4 rotation4D(int i, int j, float angle) {
    mat4 m = mat4(1.0);

    float c = cos(angle);
    float s = sin(angle);

    m[i][i] = c;
    m[j][j] = c;

    m[i][j] = -s;
    m[j][i] =  s;

    return m;
}

// For i or j:
//     0 - x axis
//     1 - y axis
//     2 - z axis
// ij represents a plane on which the rotation happens.
mat3 rotation3D(int i, int j, float angle) {
    mat3 m = mat3(1.0);

    float c = cos(angle);
    float s = sin(angle);

    m[i][i] = c;
    m[j][j] = c;
    m[i][j] = -s;
    m[j][i] = s;

    return m;
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

struct SDOutput {
    float dist;
    float trap;
};

float sdSphere( vec3 p, float r ) {
  return length(p) - r;
}

float sdBox( vec3 p, vec3 b ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdBoxFrame( vec3 p, vec3 b, float e ) {
       p = abs(p  )-b;
  vec3 q = abs(p+e)-e;
  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

float sdTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}


SDOutput sdCube4D(vec4 p, float s) {
    vec4 d = abs(p) - s;
    float dist = length(max(d, 0.0)) + min(max(max(d.x, d.y), max(d.z, d.w)), 0.0);
    return SDOutput(dist, 0.0);
}

SDOutput sdMandelbulb(vec3 p, float power, float angle) {
    vec3 z = p;
    float dr = 1.0;
    float r = 0.0;

    mat3 rotation = rotation3D(2, 1, angle * 0.8);
    rotation *= rotation3D(1, 0, angle * 0.7);

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

        z = rotation * z;
    }

    return SDOutput(0.5 * log(r) * r / dr, trap);
}

SDOutput sd16Cell(vec4 p, float s) {
    p = abs(p);
    SDOutput sdOut = SDOutput((p.x + p.y + p.z + p.w - s)* 0.57735027, 0.0);
    return sdOut;
}

SDOutput sd5Cell(vec4 p, vec4 a) {
    float dist = (max(max(max( abs(p.x+p.y+(p.w/a.w))-p.z,abs(p.x-p.y+(p.w/a.w))+p.z), abs(p.x - p.y - (p.w/a.w))+p.z),abs(p.x+p.y-(p.w/a.w))-p.z)-a.x)/sqrt(3.0);
    return SDOutput(dist, 0.0);
}

SDOutput sdMandelbox(vec3 p) {
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

SDOutput sd24Cell(vec4 p, float s) {
    p = abs(p / s);

    float m = max(
        max(p.x + p.y, p.x + p.z),
        max(p.x + p.w, p.y + p.z)
    );

    float dist = (m - 1.0) * 0.70710678;
    return SDOutput(dist * s, 0.0);
}

SDOutput sdQuaternionJulia(vec4 p, vec4 c)
{
    vec4 z = p;

    float dr = 1.0;
    float r = 0.0;

    float trap = 1e6;

    for (int i = 0; i < 16; i++)
    {
        r = length(z);

        trap = min(trap, r*r);

        if (r > 2.0)
            break;

        // derivative: dz' = 2 * z * dz
        dr = 2.0 * r * dr;

        // z²
        z = vec4(
            z.x * z.x - dot(z.yzw, z.yzw),
            2.0 * z.x * z.y,
            2.0 * z.x * z.z,
            2.0 * z.x * z.w
        );

        z += c;
    }

    return SDOutput(0.5 * log(r) * r / dr, trap);
}