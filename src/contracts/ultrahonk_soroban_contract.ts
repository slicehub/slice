import * as Client from 'ultrahonk_soroban_contract';
import { rpcUrl } from './util';

export default new Client.Client({
  networkPassphrase: 'Standalone Network ; February 2017',
  contractId: 'CCBDMYDBPMYDOSZNC7LWBTYVOTMZK3XZF3N2RABGMZFK4A5MYR7BJBBC',
  rpcUrl,
  allowHttp: true,
  publicKey: undefined,
});
