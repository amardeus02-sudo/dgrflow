import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b border-zinc-800 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">
            D
          </div>

          <span className="text-2xl font-bold text-white">
            DGRFlow
          </span>
        </div>

        <nav className="flex items-center gap-8">
          <Link href="/" className="text-zinc-300 hover:text-white transition">
            Home
          </Link>

          <Link href="/dashboard" className="text-zinc-300 hover:text-white transition">
            Dashboard
          </Link>

          <Link
            href="/login"
            className="bg-orange-500 hover:bg-orange-600 transition px-5 py-2 rounded-xl text-white font-medium"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
