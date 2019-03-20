// @flow
import pascalCase from 'pascal-case';

import type GraphQlLambdaWsPlugin from './index';

const AWS_LATEST_LAYER_NAME = 'awsLatest';

export const getLayerName = (plugin: GraphQlLambdaWsPlugin) => {
  const { awsLayer } = plugin.getOptions();

  if (awsLayer) {
    // Return supplied layer data
    return awsLayer;
  }

  return {
    Ref: `${pascalCase(AWS_LATEST_LAYER_NAME)}LambdaLayer`,
  };
};

const processLayers = async (plugin: GraphQlLambdaWsPlugin) => {
  plugin.verbose('Processing layers');

  const { awsLayer } = plugin.getOptions();
  if (awsLayer) {
    plugin.verbose('awsLayer supplied', awsLayer);
    return;
  }

  if (!plugin.service.layers) {
    // eslint-disable-next-line no-param-reassign
    plugin.service.layers = {};
  }

  const stage = plugin.getStage();
  Object.assign(plugin.service.layers, {
    [AWS_LATEST_LAYER_NAME]: {
      name: `${stage}-aws-latest`,
      description: 'Latest aws sdk for node',
      path: 'node_modules/serverless-plugin-graphql-lambda-ws/layers/aws-latest',
      compatibleRuntimes: [
        'nodejs6.10',
        'nodejs8.10',
      ],
    },
  });
};

export default processLayers;
