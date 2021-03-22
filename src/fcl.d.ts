declare module '@onflow/fcl' {
  interface Config {
    put(key: string, value?: string);
  }

  export interface Key {
    hashAlgo: number;
    index: number;
    publicKey: string;
    revoked: boolean;
    sequenceNumber: number;
    signAlgo: number;
    weight: number;
  }

  export interface Account {
    address: string;
    balance: number;
    code: string;
    contracts: {};
    keys: Key[];
  }

  interface Event<T> {
    type: string;
    data: T;
  }

  interface TransactionId {
    transactionId: string;
  }

  interface Transaction<T> {
    status: number;
    statusCode: number;
    errorMessage: string;
    events: Event<T>[];
  }

  interface FCLTransaction<T> {
    onceSealed(): Promise<Transaction<T>>;
  }

  export function config(): Config;
  export function account(address: string): Promise<Account>;
  export function send(..._: any): Promise<TransactionId>;
  export function transaction(..._: any): any;
  export function script(..._: any): any;
  export function payer(..._: any): any;
  export function proposer(..._: any): any;
  export function authorizations(..._: any): any;
  export function args(..._: any): any;
  export function arg(..._: any): any;
  export function limit(l: number): any;
  export function sansPrefix(address: string): string;
  export function tx<T>(tid: TransactionId): FCLTransaction<T>;
  export function decode(t: TransactionId): any;
  export function ping(): any;
}
