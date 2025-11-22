import * as Client from 'guess_the_puzzle';
import { rpcUrl } from './util';

export default new Client.Client({
  networkPassphrase: 'Standalone Network ; February 2017',
  contractId: 'CC35VHPZLQGE7EEW4SZYR2WRBYGE537METEHLJUFCQ3ES5S3FZCCCKPW',
  rpcUrl,
  allowHttp: true,
  publicKey: undefined,
});
