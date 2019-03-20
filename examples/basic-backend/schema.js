// @flow
const { makeExecutableSchema } = require('graphql-tools');
const { pubSub } = require('graphql-lambda-ws');

const PING_SUBSCRIBERS = 'PING_SUBSCRIBERS';

const typeDefs = `
  type Query {
    "Simple ping query. Should return 'pong'"
    ping: String
  }

  type Mutation {
    "Ping subscribers. Returns 'pong'"
    pingSubscribers(ignored: String): String!
  }

  type Subscription {
    "Subscribe to pingSubscribers mutations"
    onPing: String!
  }
`;

const resolvers = {
  Query: {
    ping: () => 'pong',
  },
  Mutation: {
    pingSubscribers: async () => {
      const payload = 'pong';
      await pubSub.publish(PING_SUBSCRIBERS, payload);
      return payload;
    },
  },
  Subscription: {
    onPing: {
      resolve: (payload) => payload,
      subscribe: pubSub.subscribe(PING_SUBSCRIBERS),
    },
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

module.exports = schema;
