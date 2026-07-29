module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    env: {
      // Release bundles carry no console noise. error/warn stay: the ErrorBoundary and
      // profile-creation failures report through console.error on purpose.
      production: {
        plugins: [["transform-remove-console", { exclude: ["error", "warn"] }]],
      },
    },
  };
};
