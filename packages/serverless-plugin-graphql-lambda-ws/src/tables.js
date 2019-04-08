// @flow

// $FlowIgnoreLine - Yarn workspaces not supported https://github.com/flow-typed/flow-typed/issues/1391
import TablesPlugin from 'serverless-plugin-tables';

import type GraphQlLambdaWsPlugin from './index';

type PluginTableNames = { [string]: string };

const createTableName = (plugin: GraphQlLambdaWsPlugin, name: string): string => {
  const serviceName = plugin.service.getServiceName();
  const stage = plugin.options.stage || plugin.service.provider.stage;
  return `${serviceName}-${stage}-${name}`;
};

export const ResourceNames = {
  SUBSCRIPTIONS: 'GraphQlSubscriptionsDynamoDBTable',
  CONNECTIONS: 'GraphQlConnectionsDynamoDBTable',
  EVENTS: 'GraphQlEventsDynamoDBTable',
};

const TableNames = {
  SUBSCRIPTIONS: 'GraphQlSubscriptions',
  CONNECTIONS: 'GraphQlConnections',
  EVENTS: 'GraphQlEvents',
};

export const createPluginTableNames = (plugin: GraphQlLambdaWsPlugin): PluginTableNames => {
  const {
    tableNames = {},
  } = plugin.getOptions();

  return {
    SUBSCRIPTIONS: tableNames.subscriptions || createTableName(plugin, TableNames.SUBSCRIPTIONS),
    CONNECTIONS: tableNames.connections || createTableName(plugin, TableNames.CONNECTIONS),
    EVENTS: tableNames.events || createTableName(plugin, TableNames.EVENTS),
  };
};

const processTables = async (plugin: GraphQlLambdaWsPlugin) => {
  plugin.verbose('Processing table resources');
  if (!plugin.service.resources) {
    // eslint-disable-next-line no-param-reassign
    plugin.service.resources = {};
  }

  const existingTables = plugin.service.resources.tables || {};

  const pluginTableNames = createPluginTableNames(plugin);
  Object.assign(plugin.service.resources, {
    tables: {
      ...existingTables,
      GraphQlConnections: {
        name: pluginTableNames.CONNECTIONS,
        resourceName: ResourceNames.CONNECTIONS,
        partitionKey: 'id',
      },
      GraphQlSubscriptions: {
        name: pluginTableNames.SUBSCRIPTIONS,
        resourceName: ResourceNames.SUBSCRIPTIONS,
        partitionKey: 'event',
        sortKey: 'subscriptionId',
      },
      GraphQlEventsDynamoDBTable: {
        name: pluginTableNames.EVENTS,
        resourceName: ResourceNames.EVENTS,
        partitionKey: 'id',
        streamType: 'newItem',
      },
    },
  });

  const tablesPlugin = new TablesPlugin(plugin.serverless, plugin.options);
  await tablesPlugin.process();
};

export default processTables;
