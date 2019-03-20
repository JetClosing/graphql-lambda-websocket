// eslint-disable-next-line func-names
module.exports = function (api) {
  if (api) {
    api.cache(true);
  }

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '8',
          browsers: 'defaults',
        },
      },
    ],
    '@babel/preset-flow',
  ];

  const plugins = [
    '@babel/plugin-proposal-class-properties',
    // [
    //   'babel-plugin-js-logger',
    //   {
    //     format: {
    //       level: 1,
    //       separator: '.',
    //       extensions: ['.js', '.jsx'],
    //       project: false,
    //     },
    //   },
    // ],
    'testable',
  ];

  return {
    presets,
    plugins,
  };
};
