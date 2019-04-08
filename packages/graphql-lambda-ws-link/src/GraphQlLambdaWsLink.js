// @flow

// $FlowIgnoreLine - Yarn workspaces not supported https://github.com/flow-typed/flow-typed/issues/1391
import { ApolloLink, Operation } from 'apollo-link';
// $FlowIgnoreLine - Yarn workspaces not supported https://github.com/flow-typed/flow-typed/issues/1391
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
