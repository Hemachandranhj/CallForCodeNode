// import dependencies and initialize express
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const healthRoutes = require("./routes/health-route");
const swaggerRoutes = require("./routes/swagger-route");
const assistanceRoutes = require("./routes/assistance-route");

const session = require("express-session");
const passport = require("passport");
const nconf = require("nconf");
const appID = require("bluemix-appid");

const helmet = require("helmet");
const express_enforces_ssl = require("express-enforces-ssl");
const cfEnv = require("cfenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const WebAppStrategy = appID.WebAppStrategy;
const userAttributeManager = appID.UserAttributeManager;
// const UnauthorizedException = appID.UnauthorizedException;

// const LOGIN_URL = '/ibm/bluemix/appid/login';
const CALLBACK_URL = "/ibm/bluemix/appid/callback";

const UI_BASE_URL = "http://localhost:4200";
// const config = require("./config/config.js");

const app = express();

// enable parsing of http request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes and api calls
app.use("/health", healthRoutes);
app.use("/swagger", swaggerRoutes);
app.use("/assistance", assistanceRoutes);

// default path to serve up index.html (single page application)
app.all("", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "../public", "index.html"));
});

// start node server
const port = process.env.PORT || global.gConfig.port;

app.use(cors({ credentials: true, origin: UI_BASE_URL }));

const isLocal = cfEnv.getAppEnv().isLocal;
const authconfig = getLocalConfig();
configureSecurity();

// Setup express application to use express-session middleware
// Must be configured with proper session storage for production
// environments. See https://github.com/expressjs/session for
// additional documentation
app.use(
    session({
        secret: "keyboardcat",
        resave: true,
        saveUninitialized: true,
        proxy: true,
        cookie: {
            httpOnly: true,
            secure: !isLocal,
            maxAge: 600000000,
        },
    })
);

// Configure express application to use passportjs
app.use(passport.initialize());
app.use(passport.session());

let webAppStrategy = new WebAppStrategy(authconfig);
passport.use(webAppStrategy);

userAttributeManager.init(authconfig);

// Configure passportjs with user serialization/deserialization.
// This is required for authenticated session persistence accross
// HTTP requests. See passportjs docs for additional
// information http://passportjs.org/docs
passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

// Protected area. If current user is not authenticated - redirect to the
// login widget will be returned. In case user is authenticated - a page with
// current user information will be returned.
app.get(
    "/auth/login",
    passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
        sxuccessRedirect: UI_BASE_URL,
        forceLogin: true,
    })
);

// Callback to finish the authorization process. Will retrieve access and
// identity tokens/ from AppID service and redirect to either (in below order)
// 1. the original URL of the request that triggered authentication, as
// persisted in HTTP session under WebAppStrategy.ORIGINAL_URL key.
// 2. successRedirect as specified in passport.authenticate(name,
//   {successRedirect: "...."}) invocation
// 3. application root ("/")
app.get(
    CALLBACK_URL,
    passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
        allowAnonymousLogin: true,
    })
);

app.get("/auth/logout", function(req, res, next) {
    WebAppStrategy.logout(req);
    res.redirect(UI_BASE_URL);
});

app.get("/auth/logged", (req, res) => {
    let loggedInAs = {};
    if (req.session[WebAppStrategy.AUTH_CONTEXT]) {
        loggedInAs["name"] = req.user.name;
        loggedInAs["email"] = req.user.email;
    }

    res.send({
        logged: !!req.session[WebAppStrategy.AUTH_CONTEXT],
        loggedInAs: loggedInAs,
    });
});

// Open the connection and start the service
mongoose.connect(
    global.gConfig.connnectionString,
    { useNewUrlParser: true },
    function(err, database) {
        if (err) throw err;
        app.locals.database = database;
        // Start the application after the database connection is ready
        app.listen(port, () => {
            console.log(`App UI available http://localhost:${port}`);
            console.log(
                `Swagger UI available http://localhost:${port}/swagger/api-docs`
            );
        });
    }
);

function isLoggedIn(req, res, next) {
    if (req.session[WebAppStrategy.AUTH_CONTEXT]) {
        next();
    } else {
        res.redirect(UI_BASE_URL);
    }
}

app.use("/user/*", isLoggedIn);

function getLocalConfig() {
    if (!isLocal) {
        return {};
    }
    let config = {};
    const localConfig = nconf
        .env()
        .file(`${__dirname}/config/authConfig.json`)
        .get();
    const requiredParams = [
        "clientId",
        "secret",
        "tenantId",
        "oauthServerUrl",
        "profilesUrl",
    ];
    requiredParams.forEach(function(requiredParam) {
        if (!localConfig[requiredParam]) {
            // console.error('When running locally, make sure to create a file
            // *config.json* in the root directory. See config.template.json
            // for an example of a configuration file.');
            console.error(`Required parameter is missing: ${requiredParam}`);
            process.exit(1);
        }
        config[requiredParam] = localConfig[requiredParam];
    });
    config["redirectUri"] = `http://localhost:${port}${CALLBACK_URL}`;
    return config;
}

function configureSecurity() {
    app.use(helmet());
    app.use(cookieParser());
    app.use(helmet.noCache());
    app.enable("trust proxy");
    if (!isLocal) {
        app.use(express_enforces_ssl());
    }
}

// error handler for unmatched routes or api calls
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "../public", "404.html"));
});

module.exports = app;
