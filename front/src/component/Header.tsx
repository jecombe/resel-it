import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header>
      <Link href="/"><b>🎟 ReselIT</b></Link>
      <nav>
        <Link href="/events">Sales</Link>
        <Link href="/resale">Resale</Link>
        <Link href="/profile">Profile</Link>
      </nav>
      <ConnectButton />
    </header>
  );
}
