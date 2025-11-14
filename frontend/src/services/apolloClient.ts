/**
 * Apollo Client Configuration
 * GraphQL client for CoinDaily Platform
 */

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

// Middleware to add authentication token
const authMiddleware = new ApolloLink((operation, forward) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });

  return forward(operation);
});

export const apolloClient = new ApolloClient({
  link: concat(authMiddleware, httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getWalletTransactions: {
            keyArgs: ['walletId'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;
