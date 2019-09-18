import createUseContext from "constate";
import useConseilJSContext from "./useConseilJSContext";
import useNetworkContext from "./useNetworkContext";

export enum TezosNetwork {
  Alphanet = "alphanet",
  Mainnet = "mainnet"
}

export enum TezosTransactionType {
  Receive = "destination",
  Send = "source"
}

export interface TezosAccount {
  mnemonic: string;
  email: string;
  secret: string;
  amount?: string;
  pkh: string;
  password: string;
}

export const PLATFORM = "tezos";

export default createUseContext(useThanosSDK);

function useThanosSDK(): any {
  const conseiljs = useConseilJSContext();
  const conseilJsLoaded = Boolean(conseiljs);

  const { network } = useNetworkContext();

  function safelyGetConseilJS() {
    if (!conseiljs) {
      throw new Error("Please, wait until conseiljs is loaded");
    }
    return conseiljs;
  }

  async function getAccount(
    networkType: string = TezosNetwork.Alphanet,
    address: string
  ): Promise<Object> {
    const conseil = safelyGetConseilJS();

    return conseil.TezosConseilClient.getAccount(
      network.config,
      networkType,
      address
    );
  }

  function initializeAccount(account: TezosAccount): Promise<any> {
    const conseil = safelyGetConseilJS();

    return conseil.TezosWalletUtil.unlockFundraiserIdentity(
      account.mnemonic,
      account.email,
      account.password,
      account.pkh
    );
  }

  function activateAccount(
    keystore: any,
    activationCode: string
  ): Promise<any> {
    const conseil = safelyGetConseilJS();

    return conseil.TezosNodeWriter.sendIdentityActivationOperation(
      network.server,
      keystore,
      activationCode,
      ""
    );
  }

  function getTotalBalance(
    address: string,
    networkType: string = TezosNetwork.Alphanet
  ): Promise<any> {
    const conseil = safelyGetConseilJS();

    let accountQuery = conseil.ConseilQueryBuilder.blankQuery();
    accountQuery = conseil.ConseilQueryBuilder.addFields(
      accountQuery,
      "manager",
      "balance"
    );
    accountQuery = conseil.ConseilQueryBuilder.addPredicate(
      accountQuery,
      "manager",
      conseil.ConseilOperator.EQ,
      [address]
    );
    accountQuery = conseil.ConseilQueryBuilder.addPredicate(
      accountQuery,
      "balance",
      conseil.ConseilOperator.GT,
      [0]
    );
    accountQuery = conseil.ConseilQueryBuilder.addAggregationFunction(
      accountQuery,
      "balance",
      conseil.ConseilFunction.sum
    );
    accountQuery = conseil.ConseilQueryBuilder.setLimit(accountQuery, 1);

    return conseil.ConseilDataClient.executeEntityQuery(
      network.config,
      PLATFORM,
      networkType,
      "accounts",
      accountQuery
    );
  }

  async function getTransactions(
    address: string,
    networkType: string = TezosNetwork.Alphanet
  ) {
    const conseil = safelyGetConseilJS();

    function prepareTransactionsQuery(txType: TezosTransactionType) {
      let sendQuery = conseil.ConseilQueryBuilder.blankQuery();
      sendQuery = conseil.ConseilQueryBuilder.addFields(
        sendQuery,
        "block_level",
        "timestamp",
        "source",
        "destination",
        "amount",
        "fee",
        "counter"
      );
      sendQuery = conseil.ConseilQueryBuilder.addPredicate(
        sendQuery,
        "kind",
        conseil.ConseilOperator.EQ,
        ["transaction"],
        false
      );
      sendQuery = conseil.ConseilQueryBuilder.addPredicate(
        sendQuery,
        txType,
        conseil.ConseilOperator.EQ,
        [address],
        false
      );
      sendQuery = conseil.ConseilQueryBuilder.addPredicate(
        sendQuery,
        "status",
        conseil.ConseilOperator.EQ,
        ["applied"],
        false
      );
      sendQuery = conseil.ConseilQueryBuilder.addOrdering(
        sendQuery,
        "block_level",
        conseil.ConseilSortDirection.DESC
      );
      sendQuery = conseil.ConseilQueryBuilder.setLimit(sendQuery, 100);
      return sendQuery;
    }

    const [received, sent] = await Promise.all(
      [TezosTransactionType.Receive, TezosTransactionType.Send]
        .map(prepareTransactionsQuery)
        .map(query =>
          conseil.ConseilDataClient.executeEntityQuery(
            network.config,
            PLATFORM,
            networkType,
            "operations",
            query
          )
        )
    );

    return received
      .concat(sent)
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
  }

  async function sendTransaction(
    keystore: any,
    to: string,
    amount: number,
    fee: number
  ) {
    const conseil = safelyGetConseilJS();

    return conseil.TezosNodeWriter.sendTransactionOperation(
      network.server,
      keystore,
      to,
      amount,
      fee,
      ""
    );
  }

  async function isAccountRevealed(account: string) {
    const conseil = safelyGetConseilJS();
    return conseil.TezosNodeReader.isManagerKeyRevealedForAccount(
      network.server,
      account
    );
  }

  return {
    conseilJsLoaded,
    initializeAccount,
    isAccountRevealed,
    activateAccount,
    getTotalBalance,
    getAccount,
    getTransactions,
    sendTransaction
  };
}