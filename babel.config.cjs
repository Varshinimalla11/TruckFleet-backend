module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" }, modules: false }]
  ],
  plugins: [],
  overrides: [
    {
      test: ["**/*.js", "**/*.mjs"],
      presets: [
        ["@babel/preset-env", { targets: { node: "current" }, modules: false }]
      ]
    }
  ],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" }, modules: false }]
      ]
    }
  }
};