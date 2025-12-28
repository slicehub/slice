import { usePrivy } from "@privy-io/react-auth";
import { useConnect, useDisconnect, useAccount } from "wagmi";
import { useEmbedded } from "./useEmbedded";

export const useSliceConnect = () => {
  const { isEmbedded } = useEmbedded();

  // 1. Get Privy controls (for Web)
  const { login, logout } = usePrivy();

  // 2. Get Wagmi controls (for Embedded)
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { address } = useAccount();

  // Unified Connect Function
  const connect = async () => {
    if (isEmbedded) {
      // Embedded Logic: Find the specific connector and force connect
      const xo = connectors.find((c) => c.id === "xo-connect");
      if (!xo) return console.error("XO Connector missing");

      try {
        await connectAsync({ connector: xo });
      } catch (err: any) {
        // Handle "Already Connected" edge case gracefully
        if (err.name === "ConnectorAlreadyConnectedError") {
          if (!address) await disconnectAsync(); // Reset if state is buggy
        }
      }
    } else {
      // Web Logic: Just let Privy handle the UI
      login();
    }
  };

  // Unified Disconnect Function
  const disconnect = async () => {
    if (isEmbedded) await disconnectAsync();
    else await logout();
  };

  return {
    connect,
    disconnect,
  };
};
