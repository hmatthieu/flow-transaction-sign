import { SHA3 } from 'sha3';
import * as Elliptic from 'elliptic';
import * as fcl from '@onflow/fcl';

fcl.config().put('accessNode.api', 'https://access-testnet.onflow.org');

// eslint-disable-next-line new-cap
const ec = new Elliptic.ec('p256');

// COPY PASTE FROM @qvvg : https://forum.onflow.org/t/request-for-best-practices-re-wallet-account-creation-server-side/446/3#post_4

function hashMsgHex(msgHex: string) {
  const sha = new SHA3(256);
  sha.update(Buffer.from(msgHex, 'hex'));
  return sha.digest();
}

function signWithKey(privateKey: string, data: string) {
  const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
  const sig = key.sign(hashMsgHex(data));
  const n = 32; // half of signature length?
  const r = sig.r.toArrayLike(Buffer, 'be', n);
  const s = sig.s.toArrayLike(Buffer, 'be', n);
  return Buffer.concat([r, s]).toString('hex');
}

// END COPY/PASTE

interface Account {
  address: string;
  publicKey: string;
  privateKey: string;
  keyId: number;
}

export const buildAuthorization = ({ address, keyId, privateKey }: Account) => (
  account: any
) => ({
  ...account,
  tempId: address,
  addr: address,
  keyId: keyId,
  resolve: null,
  signingFunction: (data: any) => {
    return {
      addr: address,
      keyId: keyId,
      signature: signWithKey(privateKey, data.message),
    };
  },
});

const admin: Account = {
  address: '0x3b814323826c6a63',
  publicKey:
    '2db41d2982317754f477dfab19aecc9d1fcdef382fd35444b35afbd3645e49f3e55a53dcb293fe54e2741a5b12159c76b29bd2b80f4fd7ea9c47c637a033a03d',
  privateKey:
    'e83db5cd93ecd4ec28cdaf425de0c60acc4cdb9a00950312b6b6b5d0722dd703',
  keyId: 0,
};

const user: Account = {
  address: '0xdfe6fafe93966abc',
  publicKey:
    '151518e2e990e714ca32025c03936cd2104890a8d64f651a619a80ef1b28fdbcef5613d2a92c80df3d13f4e166dffcd36d459c655ca631bfb196a8ac19908e1f',
  privateKey:
    '5bc078d3a1f8a439230268c71063ca066922c97ab5aa09f2da9162a50abe84a9',
  keyId: 0,
};

async function handleTransaction(description: string, args: any) {
  try {
    console.log(description);
    const transaction = await fcl.send(args);
    console.log('-->', transaction.transactionId);
    await fcl.tx(transaction).onceSealed();
    console.log('OK');
  } catch (e) {
    console.log('KO : ', e);
  }
}

async function run() {
  console.log('Ping...');
  await fcl.send([fcl.ping()]);
  console.log('OK');

  await handleTransaction('Simple transaction...', [
    fcl.transaction`
      transaction() {
        prepare(account: AuthAccount) {
          log("Hello World");
        }
      }
    `,
    fcl.payer(buildAuthorization(admin)),
    fcl.proposer(buildAuthorization(admin)),
    fcl.authorizations([buildAuthorization(admin)]),
  ]);

  await handleTransaction('Simple managed transaction...', [
    fcl.transaction`
      transaction() {
        prepare(account: AuthAccount) {
          log("Hello World");
        }
      }
    `,
    fcl.payer(buildAuthorization(admin)),
    fcl.proposer(buildAuthorization(admin)),
    fcl.authorizations([buildAuthorization(user)]),
  ]);

  await handleTransaction('Multi managed transaction payer === proposer...', [
    fcl.transaction`
      transaction() {
        prepare(accountA: AuthAccount, accountB: AuthAccount) {
          log("Hello World");
        }
      }
    `,
    fcl.payer(buildAuthorization(admin)),
    fcl.proposer(buildAuthorization(admin)),
    fcl.authorizations([buildAuthorization(user), buildAuthorization(admin)]),
  ]);

  await handleTransaction('Multi managed transaction payer !== proposer...', [
    fcl.transaction`
      transaction() {
        prepare(accountA: AuthAccount, accountB: AuthAccount) {
          log("Hello World");
        }
      }
    `,
    fcl.payer(buildAuthorization(admin)),
    fcl.proposer(buildAuthorization(user)),
    fcl.authorizations([buildAuthorization(user), buildAuthorization(admin)]),
  ]);
}

run().catch(console.error);
