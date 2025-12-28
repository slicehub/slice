import { createConfig, http } from "wagmi";
import { activeChains } from "./chains";
import { injected } from "wagmi/connectors";
import { xoConnector } from "@/wagmi/xoConnector";

const isEmbedded = process.env.NEXT_PUBLIC_IS_EMBEDDED === "true";

const connectors = isEmbedded ? [xoConnector()] : [injected()];

const transports = Object.fromEntries(
  activeChains.map((chain) => [chain.id, http()]),
);

export const config = createConfig({
  chains: activeChains,
  transports,
  connectors,
  ssr: true,
});
