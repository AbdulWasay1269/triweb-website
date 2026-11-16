/**
 * Liquid 3D gradient (in the style of shadergradient.co): a finely divided
 * plane displaced by layered simplex noise, coloured by the noise value and
 * lit by its own surface normal so the folds read as real 3D waves.
 */
export const noiseGLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`

export const gradientVertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform vec2 uFlow;
varying vec2 vUv;
varying float vN;
varying vec3 vNormal;
${noiseGLSL}
float disp(vec2 q){
  float n = snoise(vec3(q.x*uFreq + uFlow.x, q.y*uFreq*1.25 + uFlow.y, uTime*0.11));
  float n2 = snoise(vec3(q.x*uFreq*2.3 - uFlow.y, q.y*uFreq*2.3, uTime*0.19 + 7.0));
  return n + n2*0.3;
}
void main(){
  vUv = uv;
  vec3 p = position;
  float h = disp(p.xy);
  // smooth normal from neighbouring heights (no faceting)
  float e = 0.12;
  float hx = disp(p.xy + vec2(e, 0.0));
  float hy = disp(p.xy + vec2(0.0, e));
  vec3 nrm = normalize(vec3(-(hx - h) * uAmp / e, -(hy - h) * uAmp / e, 1.0));
  vNormal = normalize(normalMatrix * nrm);
  p.z += h * uAmp;
  vN = h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const gradientFragment = /* glsl */ `
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uBright;
uniform float uGrain;
varying vec2 vUv;
varying float vN;
varying vec3 vNormal;
void main(){
  vec3 nrm = normalize(vNormal);
  float light = 0.55 + 0.6 * max(dot(nrm, normalize(vec3(-0.35, 0.55, 0.9))), 0.0);
  float spec = pow(max(dot(reflect(-normalize(vec3(-0.35,0.55,0.9)), nrm), vec3(0.0,0.0,1.0)), 0.0), 24.0);
  float t = smoothstep(-0.85, 0.85, vN);
  vec3 col = mix(uC1, uC2, t);
  col = mix(col, uC3, smoothstep(0.35, 1.05, vUv.y + vN * 0.35));
  col = col * light + spec * 0.25;
  col *= uBright;
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
`

/** Build the gradient mesh. `opts.bright` < 1 gives the dark, subtle version. */
export function makeGradientMesh(THREE, { colors, bright = 1, amp = 1.3, freq = 0.16, size = [32, 20], segments = [180, 110] } = {}) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: gradientVertex,
    fragmentShader: gradientFragment,
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: amp },
      uFreq: { value: freq },
      uFlow: { value: new THREE.Vector2() },
      uC1: { value: new THREE.Color(colors[0]) },
      uC2: { value: new THREE.Color(colors[1]) },
      uC3: { value: new THREE.Color(colors[2]) },
      uBright: { value: bright },
      uGrain: { value: 0.02 },
    },
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1], segments[0], segments[1]), mat)
  return { mesh, mat }
}
