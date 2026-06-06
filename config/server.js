module.exports = {
  port: 4000,
  host: '0.0.0.0',
  historyApiFallback: true,
  hot: true,
  client: {
    overlay: {
      errors: true,
      warnings: false,
      runtimeErrors: false,
    }
  },
}
