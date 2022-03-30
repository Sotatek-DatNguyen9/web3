import { useWeb3React } from "@web3-react/core";
import { useCallback } from "react";
import { queryGraph } from "./connectGraph";

export const useQueryHistory = (orderBy, orderDirection) => {
  const { account } = useWeb3React();
  const orderByDefault = orderBy ? orderBy : "time";
  const directionDefault = orderDirection ? orderDirection : "desc";

  const queryHistory =
    Boolean(account) &&
    `{
        historyEntities(where: {address: "${account}"}, orderBy: ${orderByDefault}, orderDirection: ${directionDefault}) {
          id
          address
          amount
          time
          type
      }
    }`;

  const fetchData = useCallback(async () => {
    if (queryHistory) {
      const historyList = await queryGraph(queryHistory);
      return historyList;
    }
  }, [queryHistory]);

  return fetchData;
};
