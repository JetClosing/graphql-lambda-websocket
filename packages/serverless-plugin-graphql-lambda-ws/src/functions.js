// @flow

import CustomRolesPlugin from 'serverless-plugin-custom-roles';

import { createPolicy, createWebSocketPolicy } from './iam';
import { getLayerName } from './layers';
import { ResourceNames as TableResourceNames } from './tables';

import type GraphQlLambdaWsPlugin from './index';

export const FunctionNames = {
  HTTP: 'graphQlHttp',
  WEBSOCKET: 'graphQlWebsocket',
  EVENT: 'graphQlEventProcessor',
};

const getHandlerPath = (handlerName) => `node_modules/graphql-lambda-ws/lib/index.${handlerName}`;

export const injectFunctionNames = (plugin: GraphQlLambdaWsPlugin) => {
  if (!plugin.service.functions) {
    // eslint-disable-next-line no-param-reassign
    plugin.service.functions = {};
  }

  plugin.verbose('Injecting function names');
  Object.assign(plugin.service.functions, {
    [FunctionNames.HTTP]: {
      handler: getHandlerPath('httpHandler'),
    },
    [FunctionNames.WEBSOCKET]: {
      handler: getHandlerPath('websocketHandler'),
    },
    [FunctionNames.EVENT]: {
      handler: getHandlerPath('eventHandler'),
    },
  });
};

const processFunctions = async (plugin: GraphQlLambdaWsPlugin) => {
  plugin.verbose('Processing functions');
  if (!plugin.service.functions) {
    // eslint-disable-next-line no-param-reassign
    plugin.service.functions = {};
  }

  const {
    iamRoleStatements = [],
    httpFunctionOptions = {},
    httpOptions = {},
    wsFunctionOptions = {},
    authorizer,
  } = plugin.getOptions();

  const layers = [getLayerName(plugin)];

  const sharedGraphQlIam = [
    ...iamRoleStatements,
    createPolicy(
      [
        'dynamodb:PutItem',
      ],
      {
        'Fn::GetAtt': [TableResourceNames.EVENTS, 'Arn'],
      },
    ),
  ];

  const stage = plugin.getStage();
  Object.assign(plugin.service.functions, {
    [FunctionNames.HTTP]: {
      handler: getHandlerPath('httpHandler'),
      description: 'Lambda that handles graphQL requests over HTTP',
      layers,
      ...httpFunctionOptions,
      events: [
        {
          http: {
            path: '/graphql',
            method: 'post',
            ...httpOptions,
            authorizer: authorizer || httpOptions.authorizer,
          },
        },
      ],
      iamRoleStatements: [
        ...sharedGraphQlIam,
      ],
    },
    [FunctionNames.WEBSOCKET]: {
      handler: getHandlerPath('websocketHandler'),
      description: 'Lambda that handles graphQL requests over web sockets',
      layers,
      ...wsFunctionOptions,
      events: [
        {
          websocket: {
            route: '$connect',
            authorizer,
          },
        },
        { websocket: '$disconnect' },
        { websocket: '$default' },
      ],
      iamRoleStatements: [
        ...sharedGraphQlIam,
        createWebSocketPolicy(stage),
        createPolicy(
          [
            'dynamodb:DeleteItem',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
          ],
          {
            'Fn::GetAtt': [TableResourceNames.CONNECTIONS, 'Arn'],
          },
        ),
        createPolicy(
          [
            'dynamodb:BatchWriteItem',
            'dynamodb:DeleteItem',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
          ],
          {
            'Fn::GetAtt': [TableResourceNames.SUBSCRIPTIONS, 'Arn'],
          },
        ),
        createPolicy(
          [
            'dynamodb:BatchWriteItem',
            'dynamodb:DeleteItem',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
          ],
          {
            'Fn::GetAtt': [TableResourceNames.SUBSCRIPTION_OPS, 'Arn'],
          },
        ),
      ],
    },
    [FunctionNames.EVENT]: {
      handler: getHandlerPath('eventHandler'),
      description: 'Lambda that notifies subscribers when events are published',
      events: [
        {
          stream: {
            type: 'dynamodb',
            arn: { 'Fn::GetAtt': [TableResourceNames.EVENTS, 'StreamArn'] },
            batchSize: 100,
            startingPosition: 'LATEST',
          },
        },
      ],
      timeout: 300,
      memorySize: 1024,
      layers,
      iamRoleStatements: [
        createWebSocketPolicy(stage),
        createPolicy(
          [
            'dynamodb:DescribeStream',
            'dynamodb:GetRecords',
            'dynamodb:GetShardIterator',
            'dynamodb:ListStreams',
          ],
          {
            'Fn::GetAtt': [TableResourceNames.EVENTS, 'StreamArn'],
          },
        ),
        createPolicy(
          [
            'dynamodb:Query',
          ],
          {
            'Fn::GetAtt': [TableResourceNames.SUBSCRIPTIONS, 'Arn'],
          },
        ),
        createPolicy(
          [
            'dynamodb:DeleteItem',
          ],
          {
            'Fn::GetAtt': [TableResourceNames.CONNECTIONS, 'Arn'],
          },
        ),
        createPolicy(
          [
            'dynamodb:BatchWriteItem',
            'dynamodb:DeleteItem',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
          ],
          {
            'Fn::GetAtt': [TableResourceNames.SUBSCRIPTION_OPS, 'Arn'],
          },
        ),
      ],
    },
  });

  plugin.verbose('Initializing functions');
  plugin.service.setFunctionNames(plugin.options);

  plugin.verbose('Processing function roles');
  const customRolesPlugin = new CustomRolesPlugin(plugin.serverless, plugin.options);
  await customRolesPlugin.createRoles();
};

export default processFunctions;
