module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['jest.setup.js', '**/*.test.{ts,tsx,js,jsx}', '__tests__/**/*'],
      env: { jest: true },
    },
  ],
};
