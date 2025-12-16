import { SUPPORTED_CHAINS } from "./chains";
import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { Chain } from "viem";

const projectIdRaw = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectIdRaw) throw new Error("Project ID is not defined");
export const projectId = projectIdRaw;

// AUTOMATICALLY DERIVED NETWORKS
export const networks = SUPPORTED_CHAINS.map((c) => c.chain) as [
  Chain,
  ...Chain[],
];

// Pass to Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }) as any,
  ssr: true,
  projectId: projectId as string,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
