import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-0 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Image
            src="/images/logo.svg"
            alt="Corporación Cultural Cúcuta"
            width={60}
            height={60}
            className="rounded-full"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">SIGECUL</h1>
            <p className="text-sm text-gray-600">Corporación Cultural Cúcuta</p>
          </div>
        </div>
        <Link href="/login">
          <Button className="bg-red-500 hover:bg-red-600 shadow-lg transition-transform duration-200 hover:scale-105 focus:scale-95 focus:ring-2 focus:ring-red-300 px-6 py-2 text-base font-semibold">
            Iniciar Sesión
          </Button>
        </Link>
      </div>
    </header>
  )
}
