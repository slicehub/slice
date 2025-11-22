import * as Client from 'voting';
import { rpcUrl } from './util';
import storage from '../util/storage';

// Get contract ID from storage or use the default (newest contract)
const getContractId = (): string => {
  const stored = storage.getItem('contractId', 'safe');
  // Use the newest contract by default, but allow override via localStorage
  return stored || 'CCJUC74PEVVW2LYGJVB3A2G2WOTBTYCSPJLA4IT5ZGCAGSDHS5ZBEBBB';
};

export default new Client.Client({
  networkPassphrase: 'Standalone Network ; February 2017',
  contractId: getContractId(),
  rpcUrl,
  allowHttp: true,
  publicKey: undefined,
});
