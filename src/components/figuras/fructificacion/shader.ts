// Niebla del humidificador y aire de la turbina, en el espacio del mundo del dibujo
// (cm) y con la misma camara que el SVG (GLSL_ISO del kit). Salida premultiplicada,
// para mezclar con `screen` sobre el tema oscuro: solo suma luz.
import { ANCHO, ALERO, BOCA_CONDUCTO, BOCA_TURBINA, CANO_PVC, CODO, FONDO, SENSOR, TURBINA } from "./view";

const f = (n: number) => n.toFixed(2);
const v3 = ([x, y, z]: readonly number[]) => `vec3(${f(x)},${f(y)},${f(z)})`;

export const UNIFORMS = ["uNiebla", "uNieblaTramo", "uLargo", "uAire", "uAireTramo"];

export const FRAGMENT = `
uniform float uNiebla;     // 0..1
uniform vec2 uNieblaTramo; // (cola, cabeza) de la niebla, cm desde la boca del codo
uniform float uLargo;      // cm hasta que la niebla se evapora
uniform float uAire;       // 0..1
uniform vec2 uAireTramo;   // (cola, cabeza) del chorro de afuera, cm desde la boca del conducto

const vec3 BOCA = ${v3(CODO.boca)};
const vec3 TOMA = ${v3(BOCA_TURBINA)};
const vec3 SALIDA = ${v3(BOCA_CONDUCTO)};
const vec4 CANO = vec4(${f(CANO_PVC.x)}, ${f(CANO_PVC.y)}, ${f(CODO.r)}, ${f(CODO.z + CODO.r)});
const float CANO_Z0 = ${f(CANO_PVC.desde - 3)};
const vec3 CODO_MIN = vec3(${f(CANO_PVC.x - CODO.r)}, ${f(CODO.boca[1])}, ${f(CODO.z - CODO.r)});
const vec3 CODO_MAX = vec3(${f(CANO_PVC.x + CODO.r)}, ${f(CANO_PVC.y + CODO.r)}, ${f(CODO.z + CODO.r)});
const vec3 SENSOR_MIN = vec3(${f(SENSOR.x - SENSOR.w / 2)}, ${f(SENSOR.y - SENSOR.d / 2)}, ${f(SENSOR.z0)});
const vec3 SENSOR_MAX = vec3(${f(SENSOR.x + SENSOR.w / 2)}, ${f(SENSOR.y + SENSOR.d / 2)}, ${f(SENSOR.z1)});
const vec3 CASA = vec3(${f(ANCHO)}, ${f(FONDO)}, ${f(ALERO)});
const float T_X = ${f(TURBINA.x)};
const float T_Z = ${f(TURBINA.z)};
const float T_R = ${f(TURBINA.radio)};
const float T_C = ${f(TURBINA.collarin)};
const float T_SALIDA = ${f(TURBINA.salida)};

// Tramo del rayo [t0, t1] dentro de una caja (t0 > t1 si no la cruza).
vec2 caja(vec3 o, vec3 d, vec3 lo, vec3 hi) {
  vec3 inv = 1.0 / d;
  vec3 a = (lo - o) * inv;
  vec3 b = (hi - o) * inv;
  vec3 mn = min(a, b);
  vec3 mx = max(a, b);
  return vec2(max(max(mn.x, mn.y), mn.z), min(min(mx.x, mx.y), mx.z));
}
bool tapaCaja(vec3 p, vec3 V, vec3 lo, vec3 hi) {
  vec2 t = caja(p, V, lo, hi);
  return t.y > max(t.x, 0.0);
}
// Cilindro de eje vertical (x, y) entre z0 y z1 entre el punto y la camara.
bool tapaVertical(vec3 p, vec3 V, vec2 c, float r, float z0, float z1) {
  vec2 o = p.xy - c;
  vec2 d = V.xy;
  float a = dot(d, d);
  float b = dot(o, d);
  float k = b * b - a * (dot(o, o) - r * r);
  if (k < 0.0) return false;
  float t = (-b - sqrt(k)) / a;
  float t2 = (-b + sqrt(k)) / a;
  if (t2 < 0.0) return false;
  float z = p.z + V.z * max(t, 0.0);
  return z > z0 && z < z1;
}
// Cilindro de eje y (la turbina y el conducto) entre el punto y la camara.
bool tapaTurbina(vec3 p, vec3 V) {
  vec2 o = p.xz - vec2(T_X, T_Z);
  vec2 d = V.xz;
  for (int i = 0; i < 2; i++) {
    float r = i == 0 ? T_R : T_C;
    float a = dot(d, d);
    float b = dot(o, d);
    float k = b * b - a * (dot(o, o) - r * r);
    if (k < 0.0) continue;
    float t = max((-b - sqrt(k)) / a, 0.0);
    if ((-b + sqrt(k)) / a < 0.0) continue;
    float y = p.y + V.y * t;
    if (i == 0 && y > T_SALIDA && y < TOMA.y) return true;
    if (i == 1 && y > SALIDA.y && y < T_SALIDA) return true;
  }
  return false;
}

float niebla(vec3 p) {
  float s = BOCA.y - p.y;
  float L = uLargo;
  vec3 c = BOCA + vec3(0.0, -s, -0.25 * s * s / L);
  float sig = 1.5 + 0.16 * max(s, 0.0);
  vec2 d = vec2(p.x - c.x, (p.z - c.z) * 1.2);
  float perfil = exp(-dot(d, d) / (sig * sig));
  float tramo = smoothstep(uNieblaTramo.x - 4.0, uNieblaTramo.x + 4.0, s) * (1.0 - smoothstep(uNieblaTramo.y - 7.0, uNieblaTramo.y + 1.0, s));
  float vida = 1.0 - smoothstep(0.4 * L, L, s);
  float boca = smoothstep(-1.5, 2.5, s);
  float n = fbm3(vec3(p.x * 0.09, (p.y + uTime * 50.0) * 0.07, (p.z + uTime * 4.0) * 0.09));
  return perfil * tramo * vida * boca * (0.3 + 1.1 * smoothstep(0.3, 0.8, n)) * 4.0 / sqrt(sig);
}

float aireEntra(vec3 p) {
  vec3 q = p - TOMA;
  float dist = length(q);
  float frente = smoothstep(0.0, 4.0, q.y);
  float cerca = exp(-pow(dist / 24.0, 2.0)) * smoothstep(3.0, 9.0, dist);
  vec3 dir = q / max(dist, 0.001);
  float hilos = smoothstep(0.5, 0.85, noise3(dir * 5.0 + 7.0));
  float fase = fract(dist * 0.07 + uTime * 1.4);
  float pulso = smoothstep(0.0, 0.25, fase) * (1.0 - smoothstep(0.25, 1.0, fase));
  return frente * cerca * hilos * (0.25 + 0.75 * pulso);
}

float aireSale(vec3 p) {
  float s = SALIDA.y - p.y;
  float sig = T_C * 0.85 + 0.27 * max(s, 0.0);
  vec2 d = p.xz - SALIDA.xz;
  float perfil = exp(-dot(d, d) / (sig * sig));
  float tramo = smoothstep(uAireTramo.x - 6.0, uAireTramo.x + 6.0, s) * (1.0 - smoothstep(uAireTramo.y - 9.0, uAireTramo.y + 1.0, s));
  float vida = 1.0 - smoothstep(40.0, 80.0, s);
  float n = fbm3(vec3(p.x * 0.08, (p.y + uTime * 140.0) * 0.045, p.z * 0.08));
  float pared = tapaCaja(p, towardViewer(), vec3(0.0), CASA) ? 0.45 : 1.0;
  return perfil * tramo * vida * smoothstep(0.0, 3.0, s) * (0.25 + 0.95 * smoothstep(0.3, 0.8, n)) * pared * (T_C / sig);
}

void main() {
  vec2 vb = viewOf(gl_FragCoord.xy);
  vec3 V = towardViewer();
  vec3 o = rayOf(vb);
  float jitter = hash12(gl_FragCoord.xy);
  float n = 0.0;
  float a = 0.0;

  if (uNiebla > 0.001) {
    float L = uLargo;
    vec2 t = caja(o, V, BOCA + vec3(-24.0, -L - 8.0, -0.25 * L - 16.0), BOCA + vec3(24.0, 3.0, 12.0));
    if (t.y > t.x) {
      float dt = (t.y - t.x) / 26.0;
      for (int i = 0; i < 26; i++) {
        vec3 p = o + V * (t.x + (float(i) + jitter) * dt);
        if (tapaVertical(p, V, CANO.xy, CANO.z, CANO_Z0, CANO.w) || tapaCaja(p, V, CODO_MIN, CODO_MAX) || tapaCaja(p, V, SENSOR_MIN, SENSOR_MAX)) continue;
        n += niebla(p) * dt;
      }
    }
    n *= uNiebla;
  }

  if (uAire > 0.001) {
    vec2 t = caja(o, V, TOMA + vec3(-30.0, 0.0, -TOMA.z), TOMA + vec3(30.0, 36.0, 26.0));
    if (t.y > t.x) {
      float dt = (t.y - t.x) / 16.0;
      for (int i = 0; i < 16; i++) a += aireEntra(o + V * (t.x + (float(i) + jitter) * dt)) * dt;
    }
    t = caja(o, V, SALIDA + vec3(-30.0, -86.0, -SALIDA.z), SALIDA + vec3(30.0, 0.0, 30.0));
    if (t.y > t.x) {
      float dt = (t.y - t.x) / 22.0;
      for (int i = 0; i < 22; i++) {
        vec3 p = o + V * (t.x + (float(i) + jitter) * dt);
        if (tapaTurbina(p, V)) continue;
        a += aireSale(p) * dt;
      }
    }
    a *= uAire;
  }

  vec3 col = vec3(0.86, 0.92, 0.95) * tonemap(vec3(n * 0.22), 1.0) + vec3(0.55, 0.72, 0.86) * tonemap(vec3(a * 0.05), 1.0);
  col += (jitter - 0.5) / 255.0 * step(0.0005, n + a);
  col = max(col, 0.0);
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
}
`;
