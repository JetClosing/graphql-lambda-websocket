# graphql-lambda-websocket

This is a collection of libraries that make integrating GraphQL Subscriptions with [Amazon API Gateway Websocket's][link-api-gateway-websockets] easy when using a [Serverless][link-serverless] project.

[![Serverless][icon-serverless]][link-serverless]
[![License][icon-license]][link-license]

To get started, add [`serverless-plugin-graphql-lambda-ws`][link-serverless-plugin-graphql-lambda-ws] as a dev dependency to your existing project and add [`graphql-lambda-ws`][link-graphql-lambda-ws] as a regular dependency.

```sh
yarn add -D serverless-plugin-graphql-lambda-ws
```

```sh
yarn add graphql-lambda-ws
```

Add `serverless-plugin-graphql-lambda-ws` to your `serverless.yml` file:

```yaml
plugins:
  - serverless-plugin-graphql-lambda-ws
```

Configure the plugin so that it knows where your schema file is. You're schema should be the default export of 
the file.

```yaml
custom:
  graphql-lambda-ws:
    schemaPath: './schema'
```

For full integration example, see the [backend][link-example-backend] and [client][link-example-client] example projects.

[icon-serverless]: http://public.serverless.com/badges/v3.svg
[icon-license]: https://img.shields.io/github/license/JetClosing/graphql-lambda-websocket.svg

[link-serverless]: http://www.serverless.com/
[link-license]: ./LICENSE
[link-graphql-lambda-ws]: https://www.npmjs.com/package/graphql-lambda-ws
[link-serverless-plugin-graphql-lambda-ws]: https://www.npmjs.com/package/serverless-plugin-graphql-lambda-ws
[link-graphql-lambda-client]: https://www.npmjs.com/package/graphql-lambda-client
[link-graphql-lambda-ws-link]: https://www.npmjs.com/package/graphql-lambda-ws-link
[link-example-backend]: https://github.com/JetClosing/graphql-lambda-websocket/tree/master/examples/backend
[link-example-client]: https://github.com/JetClosing/graphql-lambda-websocket/tree/master/examples/client
[link-aws-lambda-graphql]: https://github.com/michalkvasnicak/aws-lambda-graphql/tree/master/packages/aws-lambda-graphql
[link-aws-lambda-graphql-client]: https://github.com/michalkvasnicak/aws-lambda-graphql/tree/master/packages/aws-lambda-graphql/src/client
[link-apollo-link]: https://www.apollographql.com/docs/link/
[link-api-gateway-websockets]: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-overview.html
[link-serverless-aws]: https://serverless.com/framework/docs/providers/aws/guide/
