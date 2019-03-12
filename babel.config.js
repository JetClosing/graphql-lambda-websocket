// eslint-disable-next-line func-names
module.exports = function (api) {
  if (api) {
    api.cache(true);
  }

  const presets = [
    '@babel/preset-flow',
  ];

  const plugins = [
    '@babel/plugin-proposal-class-properties',
    'testable',
  ];

  return {
    presets,
    plugins,
  };
};
