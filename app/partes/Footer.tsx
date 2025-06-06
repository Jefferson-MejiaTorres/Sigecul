import Image from "next/image"

export default function Footer() {
  return (
    <footer className="relative bg-black/80 backdrop-blur-md text-white px-4 pt-14 pb-8 shadow-2xl -mt-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-t from-black/80 via-black/60 to-transparent" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-10 md:gap-0 px-2">
        {/* Logo y descripción */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 md:w-1/3">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/images/logo-ccc.png"
              alt="Corporación Cultural Cúcuta"
              width={48}
              height={48}
              className="rounded-full border-2 border-white/30 shadow"
            />
            <div>
              <h3 className="font-bold text-lg tracking-wide">SiGeCul</h3>
              <p className="text-xs text-gray-300">Sistema de Gestión Cultural</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm max-w-xs">
            Desarrollado para la Corporación Cultural Cúcuta y organizaciones culturales similares.
          </p>
        </div>
        {/* Contacto */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 md:w-1/3">
          <h4 className="font-semibold mb-1 text-base text-white/90">Contacto</h4>
          <div className="space-y-1 text-gray-300 text-sm">
            <p>Calle 3 # 47 – 72, Barrio Los Olivos</p>
            <p>Cúcuta, Norte de Santander</p>
            <p>+57 314 5704043</p>
          </div>
        </div>
        {/* Soporte */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 md:w-1/3">
          <h4 className="font-semibold mb-1 text-base text-white/90">Soporte</h4>
          <div className="space-y-1 text-gray-300 text-sm">
            <p>Manual de Usuario</p>
            <p>Capacitación</p>
            <p>Soporte Técnico</p>
          </div>
        </div>
      </div>
      <div className="relative z-10 border-t border-white/10 mt-10 pt-6 text-center text-gray-400 text-xs">
        <p>&copy; 2025 Desarrollado por Jefferson Torres. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
