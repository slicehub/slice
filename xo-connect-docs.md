# XOConnect

`XOConnect` is an implementation of `ethers.providers.ExternalProvider` that allows dApps to interact with compatible wallets through **XOConnect protocol**, using WebView, iframe, or embedded contexts.

It is ideal for mobile or web apps that need to sign messages, send transactions, or interact with smart contracts using a non-standard wallet connection method.

---

## âœ¨ Features

- Compatible with `ethers.js` (`ethers.providers.Web3Provider`)
- Implements common JSON-RPC methods such as:
  - `eth_requestAccounts`
  - `eth_accounts`
  - `personal_sign`
  - `eth_sendTransaction`
  - `eth_signTypedData` / `eth_signTypedData_v4`
  - `eth_chainId`, `eth_blockNumber`, `eth_gasPrice`, etc.
- Provides access to the authenticated client and their available currencies

---

## ðŸ“¦ Installation

```bash
yarn add xo-connect
# or
npm install xo-connect
```

---

## ðŸš€ Basic Usage

```ts
import { XOConnectProvider } from "xo-connect";
import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(
  new XOConnectProvider(),
  "any",
);

await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();

const address = await signer.getAddress();
const signature = await signer.signMessage("Hello from XOConnect");

const tx = await signer.sendTransaction({
  to: "0x123...",
  value: ethers.utils.parseEther("0.01"),
});
```

---

## ðŸ‘¤ Accessing the Client and Currencies

XOConnect also allows you to access the current authenticated client and their supported currencies:

```ts
import { XOConnect } from "xo-connect";

const client = await XOConnect.getClient();
console.log(client.alias); // e.g. "katemiller"
console.log(client.currencies); // Array of currencies with id, symbol, image, address, etc.
```

Each currency contains:

```ts
{
  id: "polygon.mainnet.native.matic",
  symbol: "MATIC",
  address: "0x...",
  image: "https://...",
  chainId: "0x89"
}
```

---

## ðŸ“„ License

MIT

---

## Xo Connect Code Implementation

```ts
// index.ts
import { v4 as uuidv4 } from "uuid";
const Web3 = require("web3");

export enum Method {
  available = "available",
  connect = "connect",
  personalSign = "personalSign",
  transactionSign = "transactionSign",
  typedDataSign = "typedDataSign",
}

export interface Client {
  _id: string;
  alias: string;
  image: string;
  currencies: Array<{ id: string; address: string }>;
}

export interface RequestParams {
  method: Method;
  data?: any;
  currency?: string;
  onSuccess: (response: Response) => void;
  onCancel: () => void;
}

export interface Request extends RequestParams {
  id: string;
}

export interface Response {
  id: string;
  type: string;
  data: any;
}

class _XOConnect {
  private connectionId: string;
  private pendingRequests: Map<string, Request> = new Map();
  private client: Client;

  setClient(client: Client) {
    this.client = client;
  }

  async getClient(): Promise<Client | null> {
    if (!this.client) {
      const { client } = await this.connect();
      this.client = client;
    }
    return this.client;
  }

  async delay(ms: number) {
    await new Promise((resolve) => setTimeout(() => resolve(""), ms)).then(
      () => {},
    );
  }

  async connect(): Promise<{ id: string; client: Client }> {
    this.connectionId = uuidv4();

    for (let i = 0; i < 20; i++) {
      if (!window["XOConnect"]) {
        await this.delay(250);
      }
    }

    if (!window["XOConnect"]) {
      return Promise.reject(new Error("No connection available"));
    }

    window.addEventListener("message", this.messageHandler, false);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("No connection available"));
      }, 10000);

      this.sendRequest({
        method: Method.connect,
        onSuccess: (res: Response) => {
          clearTimeout(timeout);

          const client = res.data.client;
          const message = `xoConnect-${res.id}`;
          const signature = client.signature;
          const web3 = new Web3("");
          const address = web3.eth.accounts.recover(message, signature);

          const eth = client.currencies.find(
            (c) => c.id == "ethereum.mainnet.native.eth",
          );

          if (eth.address !== address) {
            throw new Error("Invalid signature");
          }

          this.setClient(client);

          resolve({
            id: res.id,
            client: res.data.client,
          });
        },
        onCancel: () => {
          reject(new Error("No connection available"));
        },
      });
    });
  }

  disconnect(): void {
    window.removeEventListener("message", this.messageHandler);
    this.connectionId = "";
  }

  sendRequest(params: RequestParams): string {
    if (!this.connectionId) {
      throw new Error("You are not connected");
    }
    const id = uuidv4();
    const request: Request = { id, ...params };
    this.pendingRequests.set(id, request);
    window.postMessage(
      JSON.stringify({
        id,
        type: "send",
        method: request.method,
        data: request.data,
        currency: request.currency || "eth",
      }),
    );
    return id;
  }

  cancelRequest(id: string): void {
    const request = this.pendingRequests.get(id);
    postMessage(
      JSON.stringify({
        id,
        type: "cancel",
        method: request.method,
      }),
    );
    this.pendingRequests.delete(id);
  }

  private processResponse(response: Response): void {
    const request = this.pendingRequests.get(response.id);
    if (request) {
      if (response.type == "receive") {
        request.onSuccess(response);
      }
      if (response.type == "cancel") {
        request.onCancel();
      }
      this.pendingRequests.delete(response.id);
    }
  }

  private messageHandler = (event: MessageEvent) => {
    if (event.data?.length) {
      const res: Response = JSON.parse(event.data);
      if (res.type != "send") this.processResponse(res);
    }
  };
}

export const XOConnect = new _XOConnect();

export { XOConnectProvider } from "./xo-connect-provider";
```

```ts
// rpc-client.ts
export class JsonRpcClient {
  constructor(private rpcUrl: string) {}

  async call<T = any>(method: string, params: any[] = []): Promise<T> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
    });
    const json = await res.json();
    if (json.error) {
      const { code, message, data } = json.error;
      const err: any = new Error(message || "RPC Error");
      err.code = code;
      err.reason = message;
      if (data) err.data = data;
      throw err;
    }
    return json.result as T;
  }
}
```

```ts
// xo-connect-provider.ts
import { Method, XOConnect } from "./";
import { JsonRpcClient } from "./rpc-client";

type Listener = (...args: any[]) => void;
type RpcMap = Record<string /* hex chainId like "0x1" */, string /* rpc url */>;

export class XOConnectProvider {
  isXOConnect = true;

  private listeners: Map<string, Set<Listener>> = new Map();
  private client: any;

  private rpcMap: RpcMap;
  private rpc: JsonRpcClient;
  private chainIdHex: string;

  constructor(opts: { rpcs: RpcMap; defaultChainId: string }) {
    if (!opts?.rpcs) throw new Error("XOConnectProvider: rpcs is required");
    if (!opts?.defaultChainId)
      throw new Error("XOConnectProvider: defaultChainId is required");
    const id = opts.defaultChainId.toLowerCase();
    if (!/^0x[0-9a-f]+$/i.test(id))
      throw new Error(
        "XOConnectProvider: chainId must be hex (e.g., 0x1, 0x89)",
      );

    this.rpcMap = opts.rpcs;
    if (!this.rpcMap[id])
      throw new Error(`XOConnectProvider: no RPC configured for ${id}`);

    this.chainIdHex = id;
    this.rpc = new JsonRpcClient(this.rpcMap[this.chainIdHex]);
  }

  // ---- Events
  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
  }
  removeListener(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }
  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((l) => l(...args));
  }

  // ---- Client & accounts
  async getClient() {
    if (!this.client) {
      this.client = await XOConnect.getClient();
      const accounts = await this.getAccounts();
      if (accounts.length) this.emit("connect", { chainId: this.chainIdHex });
    }
    return this.client;
  }

  async getAvailableCurrencies() {
    const client = await this.getClient();
    return client.currencies;
  }

  private async getAccounts(): Promise<string[]> {
    const client = await this.getClient();
    // currencies[*].chainId should be hex ("0x1", "0x89", ...)
    const cur = client.currencies?.find(
      (c: any) => (c.chainId?.toLowerCase?.() ?? "") === this.chainIdHex,
    );
    return cur?.address ? [cur.address] : [];
  }

  // ---- Helpers
  private withLatest(params?: any[], minLen = 2): any[] {
    const p = Array.isArray(params) ? [...params] : [];
    // Ensure blockTag exists for methods like eth_call, eth_getCode
    if (p.length < minLen) p[minLen - 1] = "latest";
    return p;
  }

  // ---- Signing (unchanged)
  private async personalSign(params: any[]): Promise<string> {
    const a = params ?? [];
    // Handle both [msg, addr] and [addr, msg]
    const msg =
      typeof a[0] === "string" && !a[0].startsWith("0x") && a[1] ? a[1] : a[0];
    return new Promise((resolve, reject) => {
      XOConnect.sendRequest({
        method: Method.personalSign,
        data: msg,
        onSuccess: (res) => resolve(res.data?.signature ?? res.data?.txs),
        onCancel: () => reject(new Error("User rejected signature")),
      });
    });
  }

  // XOConnectProvider: inside signTransaction
  private async signTransaction(tx: any): Promise<string> {
    const client = await this.getClient();
    const currencyId =
      tx?.currency ||
      client.currencies?.find(
        (c: any) => c.chainId?.toLowerCase() === this.chainIdHex,
      )?.id;

    if (!currencyId)
      throw new Error("Currency could not be resolved for transaction");

    const [from] = await this.getAccounts();
    const txForSigning = { from, ...tx };

    return new Promise((resolve, reject) => {
      XOConnect.sendRequest({
        method: Method.transactionSign,
        data: txForSigning,
        currency: currencyId,
        onSuccess: async (res) => {
          try {
            const d = res?.data ?? {};

            if (typeof d.signedTx === "string" && d.signedTx.startsWith("0x")) {
              const hash = await this.rpc.call<string>(
                "eth_sendRawTransaction",
                [d.signedTx],
              );
              return resolve(hash);
            }

            const hash = d.result;
            if (
              typeof hash === "string" &&
              hash.startsWith("0x") &&
              hash.length === 66
            ) {
              return resolve(hash);
            }

            return reject(
              new Error(
                "Wallet returned neither signedTx nor transaction hash",
              ),
            );
          } catch (e) {
            return reject(e);
          }
        },
        onCancel: () => reject(new Error("User rejected transaction")),
      });
    });
  }

  private async signTypedData(params: any[]): Promise<string> {
    const typed = params?.find((x) => typeof x === "object");
    return new Promise((resolve, reject) => {
      XOConnect.sendRequest({
        method: Method.typedDataSign,
        data: typed,
        onSuccess: (res) => resolve(res.data?.result),
        onCancel: () => reject(new Error("User rejected typed data signature")),
      });
    });
  }

  // ---- EIP-1193 request entrypoint
  async request({
    method,
    params,
  }: {
    method: string;
    params?: any[];
  }): Promise<any> {
    switch (method) {
      // accounts & signing
      case "eth_requestAccounts":
      case "eth_accounts":
        return this.getAccounts();
      case "personal_sign":
        return this.personalSign(params ?? []);
      case "eth_sendTransaction":
        return this.signTransaction(params?.[0]);
      case "eth_signTypedData":
      case "eth_signTypedData_v4":
        return this.signTypedData(params ?? []);

      // chain mgmt (MetaMask/WalletConnect-style)
      case "eth_chainId":
        return this.chainIdHex;
      case "net_version":
        return parseInt(this.chainIdHex, 16).toString();
      case "wallet_switchEthereumChain": {
        const next = (params?.[0]?.chainId ?? "").toLowerCase();
        if (!next)
          throw new Error("wallet_switchEthereumChain: chainId required");
        if (!this.rpcMap[next])
          throw new Error(`No RPC configured for chain ${next}`);
        this.chainIdHex = next;
        this.rpc = new JsonRpcClient(this.rpcMap[next]);
        this.emit("chainChanged", next);
        // Optional: also emit accountsChanged if your account is chain-specific
        const accs = await this.getAccounts();
        if (accs) this.emit("accountsChanged", accs);
        return null;
      }

      // reads (proxied to current rpc)
      case "eth_blockNumber":
        return this.rpc.call("eth_blockNumber");
      case "eth_gasPrice":
        return this.rpc.call("eth_gasPrice");
      case "eth_getBalance":
        return this.rpc.call(
          "eth_getBalance",
          params ?? [(await this.getAccounts())[0], "latest"],
        );
      case "eth_getTransactionCount":
        return this.rpc.call(
          "eth_getTransactionCount",
          params ?? [(await this.getAccounts())[0], "latest"],
        );
      case "eth_getCode":
        return this.rpc.call("eth_getCode", this.withLatest(params, 2));
      case "eth_call":
        return this.rpc.call("eth_call", this.withLatest(params, 2));
      case "eth_estimateGas":
        return this.rpc.call("eth_estimateGas", params ?? [{}]);
      case "eth_getLogs":
        return this.rpc.call("eth_getLogs", params ?? []);
      case "eth_getBlockByNumber":
      case "eth_getBlockByHash":
      case "eth_getTransactionByHash":
      case "eth_getTransactionReceipt":
        return this.rpc.call(method, params ?? []);

      // fallback: proxy unknowns
      default:
        return this.rpc.call(method, params ?? []);
    }
  }
}
```
