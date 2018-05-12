module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        loose: true,
        targets: {
          browsers: [
            'Chrome 40',
            'Firefox 44',
            'Edge 16',
            'Safari 11',
          ],
        },
      },
    ],
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
};
