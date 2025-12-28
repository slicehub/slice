import { useReadContract, useAccount } from "wagmi";
import { erc20Abi, formatUnits } from "viem";

export function useTokenBalance(tokenAddress: string | undefined) {
  const { address } = useAccount();

  const {
    data: balance,
    isLoading,
    refetch,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  return {
    value: balance, // BigInt
    formatted: balance ? formatUnits(balance, 6) : "0", // Assuming USDC (6 decimals)
    loading: isLoading,
    refetch,
  };
}
