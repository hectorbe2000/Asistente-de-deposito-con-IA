import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Paleta por estado ───────────────────────────── */
const CFG = {
  idle:      { eye: '#00FFE8', core: '#7DC422', light: '#0AADA0', li: 1.05 },
  listening: { eye: '#88FF44', core: '#7DC422', light: '#55CC20', li: 1.75 },
  speaking:  { eye: '#44F0FF', core: '#7DC422', light: '#00AACC', li: 2.20 },
  thinking:  { eye: '#CC88FF', core: '#9944FF', light: '#8833DD', li: 1.50 },
}

/* ─── Colores del cuerpo ──────────────────────────── */
const B1 = '#0C6B64'   // teal cuerpo principal
const B2 = '#073F3A'   // teal oscuro / paneles
const B3 = '#12908A'   // teal claro / hombros
const DK = '#020B0A'   // visor / recesos (negro espejo)
const AC = '#0AADA0'   // primario Apolo (anillos / trim)

/*
 * CABEZA: RoundedBox [1.00, 0.80, 0.76]
 *   → half-depth = 0.380   ← cara frontal en z = +0.380
 *
 * TORSO: RoundedBox [1.50, 0.98, 0.72]
 *   → half-depth = 0.360   ← cara frontal en z = +0.360
 *
 * REGLA: todo elemento facial debe estar en z > su plano frontal.
 *   Visor frame center  z = 0.394  (back=0.381, front=0.407)
 *   Visor glass center  z = 0.424  (back=0.407, front=0.441)
 *   Ojos               z = 0.482  (back=0.449 > visor front ✓)
 *   Halos ojos          z = 0.474
 *   Cejas               z = 0.460  (back=0.448 > 0.441 ✓)
 *   Boca frame          z = 0.394
 *   Boca glass          z = 0.422  (back=0.407, front=0.437)
 *   Barras boca         z = 0.456  (> boca front 0.437 ✓)
 */

function RobotBody({ state }) {
  const rootRef  = useRef()
  const eyeL     = useRef()
  const eyeR     = useRef()
  const coreRef  = useRef()
  const antTip   = useRef()
  const lightRef = useRef()
  const bar0 = useRef(), bar1 = useRef(), bar2 = useRef(), bar3 = useRef()

  const logoTex = useTexture('/apolo_logo_blanco.png')
  const c    = CFG[state] ?? CFG.idle
  const bars = [bar0, bar1, bar2, bar3]

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (!rootRef.current) return

    /* Flotación suave */
    rootRef.current.position.y = Math.sin(t * 0.72) * 0.055

    /* Orientación de cabeza */
    const r = rootRef.current.rotation
    if (state === 'idle') {
      r.y = Math.sin(t * 0.38) * 0.060
      r.x = THREE.MathUtils.lerp(r.x, 0, dt * 3)
    } else if (state === 'listening') {
      r.y = THREE.MathUtils.lerp(r.y, -0.18, dt * 2.2)
      r.x = THREE.MathUtils.lerp(r.x,  0.06, dt * 2.0)
    } else if (state === 'speaking') {
      r.x = Math.sin(t * 4.5) * 0.028
      r.y = Math.sin(t * 0.52) * 0.045
    } else {                                          // thinking
      r.y += dt * 0.34
      r.x = Math.sin(t * 0.65) * 0.040
    }

    /* Brillo de ojos */
    const ei = state === 'speaking'  ? 2.20 + Math.sin(t * 7.0) * 0.55
             : state === 'listening' ? 2.50 + Math.sin(t * 11)  * 0.45
             : state === 'thinking'  ? 1.10 + Math.sin(t * 2.2) * 0.52
             :                         0.88 + Math.sin(t * 1.5) * 0.22
    if (eyeL.current?.material) eyeL.current.material.emissiveIntensity = ei
    if (eyeR.current?.material) eyeR.current.material.emissiveIntensity = ei

    /* Núcleo del pecho */
    if (coreRef.current?.material) {
      const ci = state === 'speaking'  ? 1.65 + Math.sin(t * 6.0) * 0.50
               : state === 'listening' ? 1.85 + Math.sin(t * 10)  * 0.40
               : state === 'thinking'  ? 1.05 + Math.sin(t * 1.5) * 0.60
               :                         0.72 + Math.sin(t * 0.8) * 0.26
      coreRef.current.material.emissiveIntensity = ci
      coreRef.current.scale.setScalar(
        1 + Math.sin(t * (state === 'speaking' ? 6 : 1)) * 0.072
      )
    }

    /* Antena */
    if (antTip.current?.material)
      antTip.current.material.emissiveIntensity = 0.88 + Math.sin(t * 1.8) * 0.44

    /* ── BOCA / AUDIO BARS ── */
    bars.forEach((ref, i) => {
      if (!ref.current) return
      const mat = ref.current.material
      if (state === 'speaking') {
        /* Waveform animado vivo */
        const h = 0.22 + Math.abs(Math.sin(t * (6.5 + i * 2.1) + i * 1.2)) * 0.78
        ref.current.scale.y = h
        ref.current.scale.x = 0.9 + Math.sin(t * (3.8 + i * 0.6)) * 0.12
        if (mat) mat.emissiveIntensity = 0.7 + h * 0.8
      } else if (state === 'listening') {
        /* Ondas suaves */
        const h = 0.14 + Math.abs(Math.sin(t * (2.8 + i * 0.8) + i)) * 0.28
        ref.current.scale.y = h
        ref.current.scale.x = 1.0
        if (mat) mat.emissiveIntensity = 0.35 + h * 0.5
      } else if (state === 'thinking') {
        /* Uno a uno */
        const active = Math.floor(t * 2.5) % 4 === i
        ref.current.scale.y = active ? 0.60 : 0.12
        ref.current.scale.x = 1.0
        if (mat) mat.emissiveIntensity = active ? 0.85 : 0.12
      } else {
        /* Idle: línea baja */
        ref.current.scale.y = 0.14 + (i % 2 === 0 ? Math.abs(Math.sin(t * 0.6 + i)) * 0.06 : 0)
        ref.current.scale.x = 1.0
        if (mat) mat.emissiveIntensity = 0.14
      }
    })

    if (lightRef.current)
      lightRef.current.intensity = c.li + Math.sin(t * 3.0) * 0.32
  })

  return (
    <>
      {/* ── Luces ── */}
      <pointLight ref={lightRef}
        position={[0.5, 0.7, 3.0]} color={c.light} intensity={c.li} distance={8} decay={2} />
      <pointLight
        position={[-0.6, 0.2, 2.4]} color="#AAFFEE" intensity={0.48} distance={6} decay={2} />
      <pointLight
        position={[0.0, -1.8, 1.8]} color="#004C48" intensity={0.36} distance={5} decay={2} />

      <group ref={rootRef}>

        {/* ══════════════ CABEZA ══════════════ */}
        <group position={[0, 0.88, 0]}>

          {/* Cráneo principal */}
          <RoundedBox args={[1.00, 0.80, 0.76]} radius={0.115} smoothness={5}>
            <meshPhysicalMaterial color={B1} metalness={0.65} roughness={0.20}
              clearcoat={0.50} clearcoatRoughness={0.10} />
          </RoundedBox>

          {/* Panel superior */}
          <RoundedBox args={[0.820, 0.060, 0.640]} radius={0.024} smoothness={4}
            position={[0, 0.428, 0]}>
            <meshPhysicalMaterial color={B2} metalness={0.72} roughness={0.16}
              clearcoat={0.30} clearcoatRoughness={0.08} />
          </RoundedBox>

          {/* Tira LED frente (frente de cabeza = z 0.380) */}
          <RoundedBox args={[0.520, 0.018, 0.016]} radius={0.007} smoothness={3}
            position={[0, 0.335, 0.392]}>
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.25}
              metalness={0.88} roughness={0.06} />
          </RoundedBox>

          {/* LED dots forehead */}
          {[-0.200, -0.100, 0, 0.100, 0.200].map((x, i) => (
            <mesh key={i} position={[x, 0.340, 0.394]}>
              <sphereGeometry args={[0.013, 10, 10]} />
              <meshStandardMaterial color={AC} emissive={AC}
                emissiveIntensity={i === 2 ? 0.65 : 0.35}
                metalness={0.88} roughness={0.05} />
            </mesh>
          ))}

          {/* ── VISOR OJO: marco (front=0.407) ── */}
          <RoundedBox args={[0.730, 0.370, 0.026]} radius={0.085} smoothness={6}
            position={[0, 0.068, 0.394]}>
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.09}
              metalness={0.88} roughness={0.06} />
          </RoundedBox>

          {/* VISOR OJO: cristal (back=0.407, front=0.441) */}
          <RoundedBox args={[0.692, 0.333, 0.034]} radius={0.076} smoothness={6}
            position={[0, 0.068, 0.424]}>
            <meshPhysicalMaterial color={DK} metalness={0.96} roughness={0.03}
              clearcoat={1.0} clearcoatRoughness={0.01} />
          </RoundedBox>

          {/* OJO IZQUIERDO — z=0.482 > visor front 0.441 ✓ */}
          <mesh ref={eyeL} position={[-0.186, 0.072, 0.482]}
            scale={[1.82, 0.72, 0.36]}>
            <sphereGeometry args={[0.092, 32, 32]} />
            <meshStandardMaterial color={c.eye} emissive={c.eye}
              emissiveIntensity={0.88} roughness={0.02} />
          </mesh>
          {/* Halo ojo izquierdo */}
          <mesh position={[-0.186, 0.072, 0.474]} scale={[1.86, 0.76, 1]}>
            <ringGeometry args={[0.092, 0.132, 36]} />
            <meshStandardMaterial color={c.eye} emissive={c.eye}
              emissiveIntensity={0.26} transparent opacity={0.42}
              side={THREE.DoubleSide} />
          </mesh>

          {/* OJO DERECHO */}
          <mesh ref={eyeR} position={[0.186, 0.072, 0.482]}
            scale={[1.82, 0.72, 0.36]}>
            <sphereGeometry args={[0.092, 32, 32]} />
            <meshStandardMaterial color={c.eye} emissive={c.eye}
              emissiveIntensity={0.88} roughness={0.02} />
          </mesh>
          <mesh position={[0.186, 0.072, 0.474]} scale={[1.86, 0.76, 1]}>
            <ringGeometry args={[0.092, 0.132, 36]} />
            <meshStandardMaterial color={c.eye} emissive={c.eye}
              emissiveIntensity={0.26} transparent opacity={0.42}
              side={THREE.DoubleSide} />
          </mesh>

          {/* Cámara central (entre ojos) */}
          <mesh position={[0, 0.168, 0.488]}>
            <sphereGeometry args={[0.022, 14, 14]} />
            <meshStandardMaterial color={DK} metalness={0.96} roughness={0.03} />
          </mesh>
          <mesh position={[0, 0.168, 0.490]}>
            <ringGeometry args={[0.022, 0.032, 20]} />
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.22}
              transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>

          {/* CEJAS — z=0.460 > visor front 0.441 ✓ */}
          {[-0.186, 0.186].map((x, i) => (
            <RoundedBox key={i} args={[0.206, 0.028, 0.024]} radius={0.012} smoothness={3}
              position={[x, 0.228, 0.460]}
              rotation={[0, 0, i === 0 ? 0.22 : -0.22]}>
              <meshStandardMaterial color={B3} metalness={0.65} roughness={0.16} />
            </RoundedBox>
          ))}

          {/* Separador visor ↔ boca */}
          <RoundedBox args={[0.510, 0.014, 0.016]} radius={0.006} smoothness={3}
            position={[0, -0.086, 0.414]}>
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.20}
              metalness={0.84} roughness={0.12} />
          </RoundedBox>

          {/* ── VISOR BOCA: marco (front=0.407) ── */}
          <RoundedBox args={[0.490, 0.215, 0.026]} radius={0.050} smoothness={4}
            position={[0, -0.200, 0.394]}>
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.08}
              metalness={0.88} roughness={0.06} />
          </RoundedBox>

          {/* VISOR BOCA: cristal (back=0.407, front=0.437) */}
          <RoundedBox args={[0.455, 0.190, 0.030]} radius={0.042} smoothness={4}
            position={[0, -0.200, 0.422]}>
            <meshPhysicalMaterial color={DK} metalness={0.95} roughness={0.04}
              clearcoat={0.80} clearcoatRoughness={0.02} />
          </RoundedBox>

          {/* ── BARRAS DE AUDIO / BOCA — z=0.456 > boca front 0.437 ✓ ── */}
          {[
            [bar0, -0.150],
            [bar1, -0.050],
            [bar2,  0.050],
            [bar3,  0.150],
          ].map(([ref, x], i) => (
            <mesh key={i} ref={ref}
              position={[x, -0.200, 0.456]}
              scale={[1, 0.20, 1]}>
              <boxGeometry args={[0.050, 0.135, 0.018]} />
              <meshStandardMaterial color={c.core} emissive={c.core}
                emissiveIntensity={0.15} />
            </mesh>
          ))}

          {/* Chin accent */}
          <RoundedBox args={[0.300, 0.012, 0.014]} radius={0.005} smoothness={3}
            position={[0, -0.308, 0.406]}>
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.18}
              metalness={0.84} roughness={0.12} />
          </RoundedBox>

          {/* ── Paneles laterales (orejas con grille) ── */}
          {[-1, 1].map(s => (
            <group key={s} position={[s * 0.540, 0.040, 0]}>
              <RoundedBox args={[0.080, 0.360, 0.520]} radius={0.030} smoothness={4}>
                <meshPhysicalMaterial color={B2} metalness={0.70} roughness={0.16}
                  clearcoat={0.25} clearcoatRoughness={0.10} />
              </RoundedBox>
              {/* Speaker grille dots (cara exterior del panel) */}
              {[-0.070, 0, 0.070].map(dy =>
                [-0.085, 0.085].map((dz, k) => (
                  <mesh key={`${dy}-${k}`} position={[s * 0.042, dy, dz]}>
                    <sphereGeometry args={[0.011, 6, 6]} />
                    <meshStandardMaterial color={B1}
                      metalness={0.70} roughness={0.35} />
                  </mesh>
                ))
              )}
              {/* Franja acento */}
              <RoundedBox args={[0.088, 0.096, 0.260]} radius={0.025} smoothness={3}
                position={[0, 0.060, 0]}>
                <meshStandardMaterial color={AC} emissive={AC}
                  emissiveIntensity={0.18} metalness={0.82} roughness={0.10} />
              </RoundedBox>
              {/* LED lateral */}
              <mesh position={[s * 0.052, -0.112, 0.065]}>
                <sphereGeometry args={[0.022, 12, 12]} />
                <meshStandardMaterial color={c.eye} emissive={c.eye}
                  emissiveIntensity={0.62} roughness={0.04} />
              </mesh>
            </group>
          ))}

          {/* ── ANTENA ── */}
          {/* Base */}
          <mesh position={[0, 0.458, 0]}>
            <cylinderGeometry args={[0.050, 0.062, 0.082, 14]} />
            <meshStandardMaterial color={B2} metalness={0.75} roughness={0.16} />
          </mesh>
          {/* Anillo base */}
          <mesh position={[0, 0.460, 0]}>
            <torusGeometry args={[0.062, 0.012, 6, 18]} />
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.16}
              metalness={0.86} roughness={0.08} />
          </mesh>
          {/* Eje */}
          <mesh position={[0, 0.598, 0]}>
            <cylinderGeometry args={[0.019, 0.019, 0.224, 10]} />
            <meshStandardMaterial color={AC} metalness={0.88} roughness={0.08} />
          </mesh>
          {/* Punta brillante */}
          <mesh ref={antTip} position={[0, 0.726, 0]}>
            <sphereGeometry args={[0.044, 18, 18]} />
            <meshStandardMaterial color={c.eye} emissive={c.eye}
              emissiveIntensity={0.88} roughness={0.03} />
          </mesh>
        </group>

        {/* ══════════════ CUELLO ══════════════ */}
        <group position={[0, 0.310, 0]}>
          {/* Columna central */}
          <mesh>
            <cylinderGeometry args={[0.240, 0.310, 0.340, 22]} />
            <meshPhysicalMaterial color={B2} metalness={0.72} roughness={0.14}
              clearcoat={0.28} clearcoatRoughness={0.10} />
          </mesh>

          {/* Collar superior — cierra el gap con la cabeza */}
          <RoundedBox args={[0.720, 0.066, 0.560]} radius={0.028} smoothness={4}
            position={[0, 0.158, 0]}>
            <meshPhysicalMaterial color={B1} metalness={0.64} roughness={0.18}
              clearcoat={0.38} clearcoatRoughness={0.10} />
          </RoundedBox>

          {/* Collar inferior — se apoya sobre el bisel del torso */}
          <RoundedBox args={[0.900, 0.110, 0.680]} radius={0.032} smoothness={4}
            position={[0, -0.162, 0]}>
            <meshPhysicalMaterial color={B1} metalness={0.64} roughness={0.18}
              clearcoat={0.38} clearcoatRoughness={0.10} />
          </RoundedBox>

          {/* Guardas laterales */}
          {[-1, 1].map(s => (
            <RoundedBox key={s} args={[0.058, 0.260, 0.400]} radius={0.022} smoothness={4}
              position={[s * 0.295, 0.010, 0]}>
              <meshPhysicalMaterial color={B2} metalness={0.70} roughness={0.16}
                clearcoat={0.24} clearcoatRoughness={0.12} />
            </RoundedBox>
          ))}

          {/* Anillo central de articulación */}
          <mesh>
            <torusGeometry args={[0.240, 0.016, 8, 26]} />
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.20}
              metalness={0.88} roughness={0.08} />
          </mesh>

          {/* LED frontal cuello */}
          <RoundedBox args={[0.180, 0.014, 0.014]} radius={0.006} smoothness={3}
            position={[0, 0.096, 0.260]}>
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.30}
              metalness={0.88} roughness={0.06} />
          </RoundedBox>
        </group>

        {/* ══════════════ TORSO ══════════════ */}
        <group position={[0, -0.490, 0]}>

          {/* Cuerpo principal */}
          <RoundedBox args={[1.50, 0.98, 0.72]} radius={0.132} smoothness={5}>
            <meshPhysicalMaterial color={B1} metalness={0.60} roughness={0.22}
              clearcoat={0.45} clearcoatRoughness={0.12} />
          </RoundedBox>

          {/* Bisel superior */}
          <RoundedBox args={[1.360, 0.084, 0.640]} radius={0.034} smoothness={4}
            position={[0, 0.530, 0]}>
            <meshStandardMaterial color={B2} metalness={0.74} roughness={0.16} />
          </RoundedBox>

          {/* Clavícula (torso front = 0.360 → z=0.372) */}
          <RoundedBox args={[0.880, 0.050, 0.055]} radius={0.022} smoothness={3}
            position={[0, 0.500, 0.372]}>
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.16}
              metalness={0.86} roughness={0.10} />
          </RoundedBox>

          {/* LOGO APOLO */}
          <mesh position={[0, 0.056, 0.368]}>
            <planeGeometry args={[0.680, 0.255]} />
            <meshBasicMaterial map={logoTex} transparent />
          </mesh>

          {/* HOMBROS */}
          {[-1, 1].map(s => (
            <RoundedBox key={s} args={[0.295, 0.260, 0.640]} radius={0.092} smoothness={5}
              position={[s * 0.898, 0.326, 0]}>
              <meshPhysicalMaterial color={B3} metalness={0.62} roughness={0.20}
                clearcoat={0.38} clearcoatRoughness={0.12} />
            </RoundedBox>
          ))}

          {/* Anillo de hombro */}
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * 0.898, 0.326, 0]}
              rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.130, 0.016, 6, 20]} />
              <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.14}
                metalness={0.88} roughness={0.08} />
            </mesh>
          ))}

          {/* BRAZOS */}
          {[-1, 1].map(s => (
            <group key={s} position={[s * 0.898, -0.054, 0]}>
              <RoundedBox args={[0.265, 0.780, 0.310]} radius={0.088} smoothness={4}>
                <meshPhysicalMaterial color={B1} metalness={0.62} roughness={0.20}
                  clearcoat={0.32} clearcoatRoughness={0.12} />
              </RoundedBox>
              {/* Franja de acento en brazo */}
              <RoundedBox args={[0.026, 0.210, 0.316]} radius={0.010} smoothness={3}
                position={[0, 0.130, 0]}>
                <meshStandardMaterial color={AC} emissive={AC}
                  emissiveIntensity={0.14} metalness={0.82} roughness={0.14} />
              </RoundedBox>
              {/* Anillo codo */}
              <mesh position={[0, -0.300, 0]}>
                <torusGeometry args={[0.130, 0.020, 8, 24]} />
                <meshStandardMaterial color={AC} emissive={AC}
                  emissiveIntensity={0.16} metalness={0.88} roughness={0.08} />
              </mesh>
            </group>
          ))}
        </group>

      </group>
    </>
  )
}

/* ─── Canvas ──────────────────────────────────────── */
export default function RobotAvatar3D({ hablando, escuchando, cargando, height = 220 }) {
  const state =
    escuchando ? 'listening' :
    cargando   ? 'thinking'  :
    hablando   ? 'speaking'  :
    'idle'

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 2.40], fov: 62 }}
      gl={{ antialias: true, alpha: true }}
      style={{ height, background: 'transparent' }}
    >
      <ambientLight intensity={0.52} color="#CCFFF8" />
      <directionalLight position={[ 1.5,  2.8,  3.5]} intensity={1.30} color="#FFFFFF" />
      <directionalLight position={[-1.4,  0.5,  2.2]} intensity={0.48} color="#AAFFEE" />
      <directionalLight position={[ 0.0, -2.2,  1.5]} intensity={0.22} color="#006660" />

      <group position={[0, -0.38, 0]}>
        <RobotBody state={state} />
      </group>
    </Canvas>
  )
}
