module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          jsx: "react-jsx",
          types: ["jest"],
          isolatedModules: true,
        },
      },
    ],
  },
};
