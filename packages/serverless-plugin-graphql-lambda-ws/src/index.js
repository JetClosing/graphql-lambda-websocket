// @flow
import processTables from './tables';
import processLayers from './layers';
import processFunctions, { injectFunctionNames } from './functions';
import processProvider from './provider';

const PLUGIN_NAME = 'graphql-lambda-ws';
const PACKAGE_NAME = `serverless-plugin-${PLUGIN_NAME}`;

class GraphQlLambdaWsPlugin {
  /* eslint-disable flowtype/no-flow-fix-me-comments, no-undef */
  serverless: $FlowFixMe;
  options: $FlowFixMe;
  provider: $FlowFixMe;
  service: $FlowFixMe;
  isVerbose: boolean;
  isDebug: boolean;
  hooks: Object; // eslint-disable-line flowtype/no-weak-types
  commands: Object; // eslint-disable-line flowtype/no-weak-types
  /* eslint-enable flowtype/no-flow-fix-me-comments */

  // eslint-disable-next-line flowtype/no-flow-fix-me-comments
  constructor(serverless: $FlowFixMe, options: $FlowFixMe) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');
    this.service = serverless.service;
    this.isVerbose = options.verbose || options.v;
    this.isDebug = options.debug || options.d;

    this.commands = {
      [PLUGIN_NAME]: {
        usage: 'Add graphQL subscription support via API Gateway web sockets',
        lifecycleEvents: [
          PLUGIN_NAME,
        ],
        options: {
          verbose: {
            usage: 'Verbose output',
            shortcut: 'v',
          },
          debug: {
            usage: 'Debug the plugin',
            shortcut: 'd',
          },
        },
        commands: {
          process: {
            usage: 'Process the plugin',
            lifecycleEvents: [
              'process',
            ],
          },
        },
      },
    };

    this.hooks = {
      [`${PLUGIN_NAME}:process:process`]: () => this.process(),
      'before:package:setupProviderConfiguration': () => this.spawn('process'),
    };

    // Need to inject function names early to support function invokes
    injectFunctionNames(this);
  }

  log(...args: mixed[]) {
    const message = args.join(' ');
    this.serverless.cli.consoleLog(`${PACKAGE_NAME}: ${message}`);
  }

  verbose(...args: mixed[]) {
    if (!this.isVerbose && !this.isDebug) {
      return;
    }

    this.log(...args);
  }

  debug(...args: mixed[]) {
    if (!this.isDebug) {
      return;
    }

    this.log(...args);
  }

  spawn(command: string) {
    return this.serverless.pluginManager.spawn(`${PLUGIN_NAME}:${command}`);
  }

  getOptions() {
    return this.serverless.service.custom[PLUGIN_NAME];
  }

  getStage() {
    return this.options.stage || this.service.provider.stage;
  }

  async process() {
    try {
      const processes: Function[] = [
        processProvider,
        processLayers,
        processFunctions,
        processTables,
      ];

      processes.reduce(async (acc, p) => {
        // eslint-disable-next-line no-param-reassign
        acc = await p(this, acc);
        return acc;
      }, {});
    } catch (err) {
      if (this.isDebug) {
        // Use console to log out stack trace
        console.error('ERROR', err); // eslint-disable-line no-console
      }
      throw err;
    }
  }
}

module.exports = GraphQlLambdaWsPlugin;
// $FlowIgnoreLine
Object.assign(module.exports, {
  PLUGIN_NAME,
  PACKAGE_NAME,
});
