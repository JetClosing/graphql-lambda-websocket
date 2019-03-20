// @flow

import type GraphQlLambdaWsPlugin from './index';
import { createPluginTableNames } from './tables';

const processProvider = (plugin: GraphQlLambdaWsPlugin) => {
  plugin.verbose('Processing provider resources');
  if (plugin.service.provider.websocketApiRouteSelectionExpression) {
    throw new Error('websocketApiRouteSelectionExpression already assigned');
  }

  // eslint-disable-next-line no-param-reassign
  plugin.service.provider.websocketApiRouteSelectionExpression = '\\$default';

  const pluginTableNames = createPluginTableNames(plugin);

  const {
    schemaPath,
  } = plugin.getOptions();

  const envVars = {
    // TODO: Add debug logging
    GRAPH_QL_SCHEMA_PATH: schemaPath,
    GRAPH_QL_SUBSCRIPTIONS_TABLE: pluginTableNames.SUBSCRIPTIONS,
    GRAPH_QL_CONNECTIONS_TABLE: pluginTableNames.CONNECTIONS,
    GRAPH_QL_EVENTS_TABLE: pluginTableNames.EVENTS,
  };

  // eslint-disable-next-line no-param-reassign
  plugin.service.provider.environment = {
    ...plugin.service.provider.environment,
    ...envVars,
  };
};

export default processProvider;
