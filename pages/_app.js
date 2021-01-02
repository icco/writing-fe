import Router from "next/router";
import Head from "next/head";
import { Auth0Provider } from "@auth0/auth0-react";
import fetch from 'node-fetch';
import { abortableFetch } from 'abortcontroller-polyfill/dist/cjs-ponyfill';

import { AuthorizedApolloProvider } from "lib/apollo";

// Can not be done in _document.js
import "../style.css";

global.fetch = abortableFetch(fetch).fetch;

function Writing({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="viewport-fit=cover" />
        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width"
          key="viewport"
        />
      </Head>
      <Auth0Provider
        domain={process.env.AUTH0_DOMAIN}
        audience={"https://natwelch.com"}
        clientId={process.env.AUTH0_CLIENT_ID}
        redirectUri={process.env.DOMAIN}
        useRefreshTokens={true}
        scope={"role,profile"}
      >
        <AuthorizedApolloProvider>
          <Component {...pageProps} />
        </AuthorizedApolloProvider>
      </Auth0Provider>
    </>
  );
}

// Will be called once for every metric that has to be reported.
export function reportWebVitals(metric) {
  // These metrics can be sent to any analytics service
  console.log(metric);
}

export default Writing;
