module.exports = {
  apps: [
    {
      name: "koskalak",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
