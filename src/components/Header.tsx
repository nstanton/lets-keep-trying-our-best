import Link from "next/link";

export default function Header() {
  return (
    <header>
      <div className="bg-fpl-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 gap-4 sm:gap-0 py-4 sm:py-0">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-fpl-green rounded-full"></div>
              <Link href="/" className="text-white font-bold text-xl tracking-tight hover:text-fpl-green transition-colors">
                FPL Stats
              </Link>
            </div>
            <div className="flex sm:flex items-center gap-4 sm:gap-6">
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  Standings
                </Link>
                <Link href="#about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                  About
                </Link>
              </nav>
              <span className="text-gray-400 text-sm hidden md:block">
                Let&apos;s Keep Trying Our Best!
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-fpl-green via-fpl-cyan to-fpl-light-purple"></div>
    </header>
  );
}
