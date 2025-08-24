import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="w-full flex flex-col sm:flex-row items-center justify-between px-6 sm:px-20 py-4 bg-[#111214] text-white shadow-md">
      
      {/* Logo */}
      <div className="text-2xl font-bold mb-2 sm:mb-0">
        <Link href="/" className="hover:text-blue-400 transition">
          🎟 ReselIT
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex gap-6 mb-2 sm:mb-0">
        <Link href="/events" className="hover:text-blue-400 transition">
          Sales
        </Link>
        <Link href="/resale" className="hover:text-blue-400 transition">
          Resale
        </Link>
        <Link href="/profile" className="hover:text-blue-400 transition">
          Profile
        </Link>
      </nav>

      {/* Connect Button */}
      <div>
        <ConnectButton chainStatus="none" showBalance={false} />
      </div>
    </header>
  );
}
