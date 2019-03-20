// @flow

import {
  createDynamoDBEventProcessor,
  createHttpHandler,
  createWsHandler,
  DynamoDBConnectionManager,
  DynamoDBSubscriptionManager,
} from 'aws-lambda-graphql';

import pkgDir from 'pkg-dir';
import path from 'path';

const GRAPH_QL_SCHEMA_PATH = process.env.GRAPH_QL_SCHEMA_PATH || './schema';
const GRAPH_QL_CONNECTIONS_TABLE = process.env.GRAPH_QL_CONNECTIONS_TABLE || 'GraphQlConnections';
const GRAPH_QL_SUBSCRIPTIONS_TABLE = process.env.GRAPH_QL_SUBSCRIPTIONS_TABLE || 'GraphQlSubscriptions';

const connectionManager = new DynamoDBConnectionManager({
  connectionsTable: GRAPH_QL_CONNECTIONS_TABLE,
});

const subscriptionManager = new DynamoDBSubscriptionManager({
  subscriptionsTableName: GRAPH_QL_SUBSCRIPTIONS_TABLE,
});

const rootDir = pkgDir.sync();
const relRootPath = path.relative(__dirname, rootDir);
const relSchemaPath = path.join(relRootPath, GRAPH_QL_SCHEMA_PATH);
// $FlowIgnoreLine
const schema = require(relSchemaPath); // eslint-disable-line

const wrappedHttpHander = createHttpHandler({
  connectionManager,
  schema,
});

// eslint-disable-next-line flowtype/no-weak-types
export const httpHandler = async (event: Object, context: Object, callback: Function) => {
  // Serverless provides "content-type", but library expects "Content-Type" https://github.com/michalkvasnicak/aws-lambda-graphql/blob/master/packages/aws-lambda-graphql/src/createHttpHandler.ts#L25
  // eslint-disable-next-line no-param-reassign
  event.headers['Content-Type'] = event.headers['Content-Type'] || event.headers['content-type'];
  const result = await wrappedHttpHander(event, context, callback);
  return result;
};

export const websocketHandler = createWsHandler({
  connectionManager,
  schema,
  subscriptionManager,
});

export const eventHandler = createDynamoDBEventProcessor({
  connectionManager,
  schema,
  subscriptionManager,
});

export * from './PubSub';
