"use client"
import Image from "next/image"
import { useEffect, useState } from "react"

// Componente estrella (SVG)
function Star({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={style} className="drop-shadow-md">
      <path d="M12 2l2.9 7.6H23l-5.7 4.6L19.6 22 12 17.7 4.4 22l2.3-7.8L1 9.6h8.1z" />
    </svg>
  )
}

// Generar estrellas animadas tipo confeti
function ConfettiStars({
  color,
  side,
  show
}: {
  color: string
  side: 'left' | 'right'
  show: boolean
}) {
  // Generar 22 estrellas con posiciones y delays aleatorios, más dispersas
  const stars = Array.from({ length: 22 }).map((_, i) => {
    // Más dispersión vertical y horizontal
    const top = side === 'left'
      ? 55 + Math.random() * 40 // 55% a 95% de la pantalla (abajo)
      : Math.random() * 60 // 0% a 60% de la pantalla (arriba)
    const left = side === 'left'
      ? Math.random() * 45 // 0% a 45% de la pantalla (más disperso)
      : 55 + Math.random() * 45 // 55% a 100% de la pantalla
    const delay = Math.random() * 0.9 + 0.05 // 0.05s a 0.95s
    const duration = Math.random() * 0.7 + 1.1 // 1.1s a 1.8s
    const scale = Math.random() * 0.6 + 0.7 // 0.7 a 1.3
    return (
      <span
        key={i}
        style={{
          position: 'fixed',
          top: `${top}vh`,
          left: side === 'left' ? `${left}vw` : undefined,
          right: side === 'right' ? `${100 - left}vw` : undefined,
          zIndex: 60,
          pointerEvents: 'none',
          opacity: show ? 1 : 0,
          transition: `opacity 0.3s`,
          animation: show
            ? `star-fall-${side} ${duration}s ${delay}s both cubic-bezier(.6,.1,.4,1)`
            : 'none',
          transform: `scale(${scale}) rotate(${Math.random() * 360}deg)`
        }}
      >
        <Star color={color} />
      </span>
    )
  })
  return <>{stars}</>
}

// Animaciones CSS para las estrellas
const style = `
@keyframes star-fall-left {
  0% { opacity: 0; transform: translateY(30px) scale(var(--scale,1)); }
  10% { opacity: 1; }
  100% { opacity: 0.7; transform: translateY(-40vh) scale(var(--scale,1)); }
}
@keyframes star-fall-right {
  0% { opacity: 0; transform: translateY(-30px) scale(var(--scale,1)); }
  10% { opacity: 1; }
  100% { opacity: 0.7; transform: translateY(40vh) scale(var(--scale,1)); }
}
`;

export default function AnimacionesLogos() {
  const [show, setShow] = useState(true)
  const [animate, setAnimate] = useState<'in' | 'out'>('out')

  // Animación de entrada retardada medio segundo
  useEffect(() => {
    const timer = setTimeout(() => setAnimate('in'), 500)
    return () => clearTimeout(timer)
  }, [])

  // Mostrar animaciones solo cuando el usuario está cerca del inicio de la página
  useEffect(() => {
    let timeoutOut: NodeJS.Timeout | null = null
    let idleTimeout: NodeJS.Timeout | null = null
    let lastScrollY = window.scrollY

    function hideByIdle() {
      if (show && animate !== 'out') {
        setAnimate('out')
        timeoutOut = setTimeout(() => setShow(false), 600)
      }
    }

    function onScroll() {
      // Cancelar cualquier timeout de inactividad
      if (idleTimeout) clearTimeout(idleTimeout)
      lastScrollY = window.scrollY
      if (window.scrollY < 80) {
        if (!show) {
          setShow(true)
          setAnimate('in')
        } else if (animate !== 'in') {
          setAnimate('in')
        }
        // Si está arriba, iniciar timeout para ocultar por inactividad
        idleTimeout = setTimeout(hideByIdle, 2000)
      } else {
        if (show && animate !== 'out') {
          setAnimate('out')
          if (timeoutOut) clearTimeout(timeoutOut)
          timeoutOut = setTimeout(() => setShow(false), 600)
        }
      }
    }

    // Al entrar, si está arriba, iniciar timeout de inactividad
    if (window.scrollY < 80) {
      idleTimeout = setTimeout(hideByIdle, 2000)
    }

    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timeoutOut) clearTimeout(timeoutOut)
      if (idleTimeout) clearTimeout(idleTimeout)
    }
  }, [show, animate])

  if (!show) return null

  // Animaciones: entrada desde la esquina (diagonal), salida hacia la esquina
  const animCCC = animate === 'in'
    ? 'translate-x-[-10%] translate-y-[10%] opacity-100 scale-100'
    : 'translate-x-[-60%] translate-y-[60%] opacity-0 scale-75'
  const animTeatro = animate === 'in'
    ? 'translate-x-[10%] -translate-y-[10%] opacity-100 scale-100'
    : 'translate-x-[60%] -translate-y-[60%] opacity-0 scale-75'

  return (
    <>
      <style>{style}</style>
      {/* Confeti de estrellas CCC (rojo pastel) */}
      <ConfettiStars color="#ef4444" side="left" show={animate === 'in'} />
      {/* Confeti de estrellas Teatro (negro) */}
      <ConfettiStars color="#111" side="right" show={animate === 'in'} />
      {/* Logo CCC - esquina inferior izquierda, escondido en diagonal y animado */}
      <div
        className={`fixed left-4 bottom-4 z-50 bg-white rounded-full shadow-xl border border-black/30 p-2 flex items-center justify-center transition-all duration-700 ease-in-out ${animCCC}`}
        style={{ width: 168, height: 168 }}
      >
        <Image
          src="/images/logo.svg"
          alt="Logo CCC"
          width={144}
          height={144}
          className="object-cover rounded-full"
          draggable={false}
        />
      </div>
      {/* Logo Teatro - esquina superior derecha, escondido en diagonal y animado */}
      <div
        className={`fixed right-4 top-24 z-50 bg-white rounded-full shadow-xl border border-black/30 p-2 flex items-center justify-center transition-all duration-700 ease-in-out ${animTeatro}`}
        style={{ width: 168, height: 168 }}
      >
        <Image
          src="/images/logo-teatro.svg"
          alt="Logo Teatro"
          width={144}
          height={144}
          className="object-cover rounded-full"
          draggable={false}
        />
      </div>
    </>
  )
}
