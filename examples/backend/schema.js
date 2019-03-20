const { makeExecutableSchema } = require('graphql-tools');
const gql = require('graphql-tag');
const { pubSub, withFilter } = require('graphql-lambda-ws');
const { getUser, putUser } = require('./dynamoHelper');

const typeDefs = gql`
  "A user"
  type User {
    "The unique ID for a user"
    userId: ID!

    "The email associated with user"
    email: String

    "The user's first name"
    firstName: String

    "The user's last name"
    lastName: String
  }

  type Query {
    "Returns user record for the given ID"
    userById(userId: ID!): User
  }

  type Mutation {
    putUser(userId: ID!, email: String, firstName: String, lastName: String): User
  }

  type Subscription {
    "Subscribe to user creations"
    userCreated: User

    "Subscribe to user updates"
    userUpdated(userId: ID!): User
  }
`;

const resolvers = {
  Query: {
    userById: async (_, args) => {
      const { userId } = args;
      const user = await getUser(userId);
      return user;
    },
  },
  Mutation: {
    putUser: async (_, args) => {
      const user = args;
      await putUser(user);
      return user;
    },
  },
  Subscription: {
    userCreated: {
      resolve: (payload) => payload,
      subscribe: pubSub.subscribe('UserCreated'),
    },
    userUpdated: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        pubSub.subscribe('UserUpdated'),
        (payload, variables) => payload.userId === variables.userId,
      ),
    },
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

module.exports = schema;
