import React, { useEffect, useState } from "react";
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloProvider,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useAuth0 } from "@auth0/auth0-react";

const GRAPHQL_ORIGIN =
  process.env.GRAPHQL_ORIGIN || "https://graphql.natwelch.com/graphql";

function ApolloWrapper({ children }) {
  const { isAuthenticated, getTokenSilently } = useAuth0();
  const [bearerToken, setBearerToken] = useState("");
  const httpLink = new HttpLink({ uri: GRAPHQL_ORIGIN });

  useEffect(() => {
    const getToken = async () => {
      const token = isAuthenticated ? await getTokenSilently() : "";
      setBearerToken(token);
    };
    getToken();
  }, [getTokenSilently, isAuthenticated]);

  const authLink = setContext((_, { headers, ...rest }) => {
    if (!bearerToken) return { headers, ...rest };

    return {
      ...rest,
      headers: {
        ...headers,
        authorization: `Bearer ${bearerToken}`,
      },
    };
  });

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default ApolloWrapper;
