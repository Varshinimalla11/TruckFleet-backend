export default {
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest", // lets Jest handle ES6/JSX
  },

  testEnvironment: "node", // use "jsdom" if you test React components
  moduleFileExtensions: ["js", "jsx", "json"],
};
