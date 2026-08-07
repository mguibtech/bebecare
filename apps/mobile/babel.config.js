function inlineProductionApiUrl({ types: t }) {
  const apiBaseUrl = process.env.BEBECARE_API_BASE_URL ?? '';

  return {
    name: 'inline-bebecare-production-api-url',
    visitor: {
      Identifier(path) {
        if (
          path.node.name === '__BEBECARE_API_BASE_URL__' &&
          path.isReferencedIdentifier()
        ) {
          path.replaceWith(t.stringLiteral(apiBaseUrl));
        }
      },
    },
  };
}

module.exports = (api) => {
  // A URL pode mudar entre builds de release; evita reutilizar o cache do Babel
  // com a URL de uma distribuição anterior.
  api.cache.using(() => process.env.BEBECARE_API_BASE_URL ?? '');

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      inlineProductionApiUrl,
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
    // IMPORTANTE: worklets/plugin DEVE ser o ultimo da lista
      'react-native-worklets/plugin',
    ],
  };
};
