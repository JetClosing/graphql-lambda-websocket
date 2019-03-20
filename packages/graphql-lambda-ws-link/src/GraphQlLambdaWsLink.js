// @flow

import { ApolloLink, Operation } from 'apollo-link';
import { GraphQlLambdaClient } from 'graphql-lambda-client';

type Options = {
  uri: string,
};

class GraphQlLambdaWsLink extends ApolloLink {
  constructor(options: Options) {
    super();

    this.client = new GraphQlLambdaClient({
      uri: options.uri,
    });
  }

  request(operation: Operation) {
    return this.client.request(operation);
  }
}

export { GraphQlLambdaWsLink };

export default GraphQlLambdaWsLink;
