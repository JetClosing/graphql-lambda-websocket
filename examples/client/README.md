This is an example client that uses ApolloClient and the deployed `serverless-plugin-graphql-lambda-ws` backend. It will work with the example [backend][link-example-backend] project.

To get started, first deploy the backend project. Then update the [uri's in `apolloClient`][link-example-client-apollo-client] with the `POST` and `wss` endpoints that were created by your service.

Next run: `yarn start` to start the web server.

[link-example-backend]: https://github.com/JetClosing/graphql-lambda-websocket/tree/master/examples/backend
[link-example-client-apollo-client]: https://github.com/JetClosing/graphql-lambda-websocket/blob/master/examples/client/src/apolloClient.js
