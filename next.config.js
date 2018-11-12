// https://github.com/zeit/next-plugins/tree/master/packages/next-css
const withCSS = require("@zeit/next-css");
module.exports = {
  withCSS: withCSS(),
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    graphql_origin: "https://graphql.natwelch.com",
  },
};
