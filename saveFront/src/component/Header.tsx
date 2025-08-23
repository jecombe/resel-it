import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header>
      <Link href="/"><b>🎟 ReselIT</b></Link>
      <nav>
        <Link href="/events">Événements</Link>
        <Link href="/profile">Profil</Link>
        <Link href="/resale">Revente</Link>
      </nav>
      <ConnectButton />
    </header>
  );
}
