export default {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" }, // ensures Jest runs correctly in Node
      },
    ],
    // If you’re using React, keep this line:
    // "@babel/preset-react"
  ],
};
