// @flow

import { DynamoDBEventStore } from 'aws-lambda-graphql';

const GRAPH_QL_EVENTS_TABLE = process.env.GRAPH_QL_EVENTS_TABLE || 'GraphQlEvents';

const eventStore = new DynamoDBEventStore({
  eventsTable: GRAPH_QL_EVENTS_TABLE,
});

export default eventStore;
