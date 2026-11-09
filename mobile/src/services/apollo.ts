import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ENV } from '../config/env';
import { getAccessToken } from './auth';

const httpLink = createHttpLink({
  uri: ENV.APPSYNC_ENDPOINT,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// The server rejects every data request once a user's free trial and paid
// subscription have both ended (AppSync errorType "SubscriptionRequired").
// The subscription provider registers here so it can show the paywall.
let onSubscriptionRequired: (() => void) | null = null;

export function setSubscriptionRequiredHandler(handler: (() => void) | null) {
  onSubscriptionRequired = handler;
}

const subscriptionErrorLink = onError(({ graphQLErrors }) => {
  const required = graphQLErrors?.some(
    (e) => (e as unknown as { errorType?: string }).errorType === 'SubscriptionRequired',
  );
  if (required) onSubscriptionRequired?.();
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([subscriptionErrorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          listCpdActivities: {
            keyArgs: ['categoryId', 'dateRangeStart', 'dateRangeEnd', 'sortBy'],
            merge(existing, incoming) {
              if (!existing) return incoming;
              return {
                ...incoming,
                items: [...existing.items, ...incoming.items],
              };
            },
          },
          listDrafts: {
            keyArgs: false,
            merge(existing, incoming) {
              if (!existing) return incoming;
              return {
                ...incoming,
                items: [...existing.items, ...incoming.items],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});
