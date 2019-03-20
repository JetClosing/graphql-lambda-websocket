import { GraphQlLambdaWsLink } from 'graphql-lambda-ws-link';
import { ApolloClient } from 'apollo-client';
import { getMainDefinition } from 'apollo-utilities';
import { split } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

// https://github.com/apollographql/apollo-client/blob/master/docs/source/advanced/subscriptions.md#client-setup
const isSubscription = (query) => {
  const { kind, operation } = getMainDefinition(query);
  return kind === 'OperationDefinition' && operation === 'subscription';
};

// eslint-disable-next-line import/prefer-default-export
export const createApolloClient = () => {
  // TODO: Replace with your outputs from serverless
  const httpUri = 'https://xxxxxxxx.execute-api.us-west-2.amazonaws.com/myStage/graphql';
  const wsUri = 'wss://xxxxxxxxxx.execute-api.us-west-2.amazonaws.com/myStage';

  const httpLink = createHttpLink({ uri: httpUri });

  const wsLink = new GraphQlLambdaWsLink({
    uri: wsUri,
  });

  const link = split(
    ({ query }) => isSubscription(query),
    wsLink,
    httpLink,
  );

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });

  return client;
};
