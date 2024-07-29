export default /*glsl*/ `

varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPattern;

uniform vec2 uResolution;
uniform float uTime;
uniform float uDisplace;
uniform float uSpread;
uniform float uNoise;
uniform vec2 uMouse;

#define PI 3.14159265358979
#define MOD3 vec3(.1031,.11369,.13787)

vec3 hash33(vec3 p3) {
	p3 = fract(p3 * MOD3);
    p3 += dot(p3, p3.yxz+19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

float pnoise(vec3 p) {
    vec3 pi = floor(p);
    vec3 pf = p - pi;
    vec3 w = pf * pf * (3. - 2.0 * pf);
    return 	mix(
        		mix(
                	mix(dot(pf - vec3(0, 0, 0), hash33(pi + vec3(0, 0, 0))),
                        dot(pf - vec3(1, 0, 0), hash33(pi + vec3(1, 0, 0))),
                       	w.x),
                	mix(dot(pf - vec3(0, 0, 1), hash33(pi + vec3(0, 0, 1))),
                        dot(pf - vec3(1, 0, 1), hash33(pi + vec3(1, 0, 1))),
                       	w.x),
                	w.z),
        		mix(
                    mix(dot(pf - vec3(0, 1, 0), hash33(pi + vec3(0, 1, 0))),
                        dot(pf - vec3(1, 1, 0), hash33(pi + vec3(1, 1, 0))),
                       	w.x),
                   	mix(dot(pf - vec3(0, 1, 1), hash33(pi + vec3(0, 1, 1))),
                        dot(pf - vec3(1, 1, 1), hash33(pi + vec3(1, 1, 1))),
                       	w.x),
                	w.z),
    			w.y);
}

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Convert mouse coordinates from -1 to 1 range to 0 to 1 range
    vec2 mouse = (uMouse + 1.0) / 2.0;

    // Calculate distance from mouse to vertex position
    float dist = distance(mouse, vUv) * 2.0;

    // Apply distortion based on distance from mouse
    float influence = uDisplace * exp(-dist * uSpread);

    float pat = pnoise(vec3(vUv * uNoise , sin(uTime) * 1.4 )) * influence * 10.;
    float proximity = abs(vUv.x - (.5 + sin(uTime)/(12. * uSpread ) ));

    vec3 full = pat * vec3(clamp(.23 * uSpread  - proximity * 5. , 0., 1.));
    vec3 newPosition = vPosition + vNormal * full; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;
