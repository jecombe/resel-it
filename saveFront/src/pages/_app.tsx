import "../styles/globals.css";
import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { http } from "viem";
import { hardhat, mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;
const chainName = process.env.NEXT_PUBLIC_CHAIN || "sepolia";

const chain =
  chainName === "sepolia" ? sepolia :
  chainName === "mainnet" ? mainnet :
  hardhat; // par défaut

const config = getDefaultConfig({
  appName: "ReselIT",
  projectId,
  chains: [chain],
  transports: {
    [chain.id]: http(), // RainbowKit/Wagmi utilisera window.ethereum quand dispo
  },
  ssr: true,
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
