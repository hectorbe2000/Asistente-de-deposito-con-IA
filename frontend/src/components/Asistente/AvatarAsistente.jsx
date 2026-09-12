import { Suspense } from 'react'
import RobotAvatar3D from './RobotAvatar3D'

const ESTADOS = {
  idle:      { label: 'Listo',           color: 'bg-muted',    text: 'text-muted'   },
  listening: { label: 'Escuchando...',   color: 'bg-success',  text: 'text-success' },
  thinking:  { label: 'Pensando...',     color: 'bg-accent',   text: 'text-accent'  },
  speaking:  { label: 'Respondiendo...', color: 'bg-primary',  text: 'text-primary' },
}

function FallbackRobot() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-5xl animate-pulse select-none">🤖</div>
    </div>
  )
}

export default function AvatarAsistente({ hablando = false, escuchando = false, cargando = false }) {
  const key = escuchando ? 'listening' : cargando ? 'thinking' : hablando ? 'speaking' : 'idle'
  const estado = ESTADOS[key]
  const pulsar = key !== 'idle'

  return (
    <div className="flex flex-col items-center gap-2 w-full select-none">
      {/* Canvas 3D */}
      <div className="w-full" style={{ height: 220 }}>
        <Suspense fallback={<FallbackRobot />}>
          <RobotAvatar3D
            hablando={hablando}
            escuchando={escuchando}
            cargando={cargando}
            height={220}
          />
        </Suspense>
      </div>

      {/* Etiqueta de estado */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${estado.color} ${pulsar ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-medium ${estado.text}`}>{estado.label}</span>
      </div>
    </div>
  )
}
