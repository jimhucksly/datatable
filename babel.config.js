module.exports = {
  "env": {
    "test": {
      "presets": ["@babel/preset-env", '@babel/preset-typescript'],
      "plugins": [
        "const-enum",
        ["@babel/plugin-proposal-decorators", { "legacy": true }],
        "@babel/plugin-transform-class-properties",
        "@babel/plugin-transform-typescript",
        "@babel/plugin-proposal-export-default-from",
        "@babel/plugin-transform-export-namespace-from"
      ]
    }
  }
}
