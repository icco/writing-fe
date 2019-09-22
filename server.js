"use strict";

const { SSLMiddleware } = require("@icco/react-common");
const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const next = require("next");
const rss = require("feed");
const gql = require("graphql-tag");
const { parse } = require("url");
const { join } = require("path");
const opencensus = require("@opencensus/core");
const tracing = require("@opencensus/nodejs");
const stackdriver = require("@opencensus/exporter-stackdriver");
const propagation = require("@opencensus/propagation-stackdriver");
const sitemap = require("sitemap");
const pinoMiddleware = require("pino-http");

const apollo = require("./lib/init-apollo.js");
const { logger } = require("./lib/logger.js");

const GOOGLE_PROJECT = "icco-cloud";
const port = parseInt(process.env.PORT, 10) || 8080;

async function recentPosts() {
  try {
    const client = apollo.create({}, {});
    let res = await client.query({
      query: gql`
        query recentPosts {
          posts(input: { limit: 20, offset: 0 }) {
            id
            title
            datetime
            summary
          }
        }
      `,
    });

    return res.data.posts;
  } catch (err) {
    logger.error(err);
    return [];
  }
}

async function mostPosts() {
  try {
    const client = apollo.create({}, {});
    let res = await client.query({
      query: gql`
        query mostPosts {
          posts(input: { limit: 1000, offset: 0 }) {
            id
          }
        }
      `,
    });

    return res.data.posts;
  } catch (err) {
    logger.error(err);
    return [];
  }
}

async function allTags() {
  try {
    const client = apollo.create({}, {});
    let res = await client.query({
      query: gql`
        query tags {
          tags
        }
      `,
    });

    return res.data.tags;
  } catch (err) {
    logger.error(err);
    return [];
  }
}

async function generateFeed() {
  let feed = new rss.Feed({
    title: "Nat? Nat. Nat!",
    favicon: "https://writing.natwelch.com/favicon.ico",
    description: "Nat Welch's Blog about random stuff.",
  });
  try {
    let data = await recentPosts();

    data.forEach(p => {
      feed.addItem({
        title: p.title,
        link: `https://writing.natwelch.com/post/${p.id}`,
        date: new Date(p.datetime),
        content: p.summary,
        author: [
          {
            name: "Nat Welch",
            email: "nat@natwelch.com",
            link: "https://natwelch.com",
          },
        ],
      });
    });
  } catch (err) {
    logger.error(err);
  }

  return feed;
}

async function generateSitemap() {
  let urls = [];
  let postIds = await mostPosts();
  postIds.forEach(function(x) {
    urls.push({ url: `/post/${x.id}` });
  });

  let tags = await allTags();
  tags.forEach(function(t) {
    urls.push({ url: `/tag/${t}` });
  });

  urls.push({ url: "/" });
  return sitemap.createSitemap({
    hostname: "https://writing.natwelch.com",
    cacheTime: 6000000, // 600 sec - cache purge period
    urls,
  });
}

async function startServer() {
  if (process.env.ENABLE_STACKDRIVER) {
    const sse = new stackdriver.StackdriverStatsExporter({
      projectId: GOOGLE_PROJECT,
    });
    opencensus.globalStats.registerExporter(sse);

    const sp = propagation.v1;
    const ste = new stackdriver.StackdriverTraceExporter({
      projectId: GOOGLE_PROJECT,
    });
    const tracer = tracing.start({
      samplingRate: 1,
      logger: logger,
      exporter: ste,
      propagation: sp,
    }).tracer;

    tracer.startRootSpan({ name: "init" }, rootSpan => {
      for (let i = 0; i < 1000000; i++) {}

      rootSpan.end();
    });
  }

  const app = next({
    dir: ".",
    dev: process.env.NODE_ENV !== "production",
  });

  app
    .prepare()
    .then(() => {
      const server = express();
      server.set("trust proxy", true);

      server.use(
        pinoMiddleware({
          logger,
        })
      );

      server.use(helmet());

      server.use(
        helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" })
      );

      server.use(
        helmet.contentSecurityPolicy({
          directives: {
            //  default-src 'none'
            defaultSrc: ["'none'"],
            // style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com/",
            ],
            // connect-src 'self' https://graphql.natwelch.com/graphql
            contentSrc: ["'self'", "https://graphql.natwelch.com/graphql"],
            // font-src https://fonts.gstatic.com
            fontSrc: ["https://fonts.gstatic.com"],
            // img-src 'self' data: http://a.natwelch.com https://a.natwelch.com https://icco.imgix.net
            imgSrc: [
              "'self'",
              "data:",
              "http://a.natwelch.com",
              "https://a.natwelch.com",
              "https://icco.imgix.net",
            ],
            // script-src 'self' 'unsafe-eval' 'unsafe-inline' http://a.natwelch.com/tracker.js https://a.natwelch.com/tracker.js
            scriptSrc: [
              "'self'",
              "'unsafe-eval'",
              "'unsafe-inline'",
              "https://a.natwelch.com/tracker.js",
            ],
          },
        })
      );

      server.use(compression());

      server.use(SSLMiddleware());

      server.get("/healthz", (req, res) => {
        res.json({ status: "ok" });
      });

      server.get("/post/:id", (req, res) => {
        const actualPage = "/post";
        const queryParams = { id: req.params.id };
        app.render(req, res, actualPage, queryParams);
      });

      server.get("/edit/:id", (req, res) => {
        const actualPage = "/admin/post";
        const queryParams = { id: req.params.id };
        app.render(req, res, actualPage, queryParams);
      });

      server.get("/tags/:id", (req, res) => {
        res.redirect(`/tag/${req.params.id}`);
      });

      server.get("/tag/:id", (req, res) => {
        const actualPage = "/tag";
        const queryParams = { id: req.params.id };
        app.render(req, res, actualPage, queryParams);
      });

      server.get("/feed.rss", async (req, res) => {
        let feed = await generateFeed();
        res.set("Content-Type", "application/rss+xml");
        res.send(feed.rss2());
      });

      server.get("/feed.atom", async (req, res) => {
        let feed = await generateFeed();
        res.set("Content-Type", "application/atom+xml");
        res.send(feed.atom1());
      });

      server.get("/sitemap.xml", async (req, res) => {
        let sm = await generateSitemap();
        sm.toXML(function(err, xml) {
          if (err) {
            logger.error(err);
            return res.status(500).end();
          }
          res.header("Content-Type", "application/xml");
          res.send(xml);
        });
      });

      server.all("*", (req, res) => {
        const handle = app.getRequestHandler();
        const parsedUrl = parse(req.url, true);
        const rootStaticFiles = [
          "/robots.txt",
          "/sitemap.xml",
          "/favicon.ico",
          "/.well-known/brave-payments-verification.txt",
        ];

        const redirects = {};

        if (parsedUrl.pathname in redirects) {
          return res.redirect(redirects[parsedUrl.pathname]);
        }

        if (
          rootStaticFiles.indexOf(parsedUrl.pathname) > -1 ||
          parsedUrl.pathname.match(/^\/.*\.svg/)
        ) {
          const path = join(__dirname, "static", parsedUrl.pathname);
          app.serveStatic(req, res, path);
        } else {
          handle(req, res, parsedUrl);
        }
        return;
      });

      server.listen(port, "0.0.0.0", err => {
        if (err) throw err;
        logger.info(`> Ready on http://localhost:${port}`);
      });
    })
    .catch(ex => {
      logger.error(ex.stack);
      process.exit(1);
    });
}

startServer();
