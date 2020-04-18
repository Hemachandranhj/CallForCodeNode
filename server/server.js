// import dependencies and initialize express
require("./config/config");
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

const CALLBACK_URL = "/";

const UI_BASE_URL = global.gConfig.UI_BASE_URL;

const app = express();

// enable parsing of http request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes and api calls
app.use("/health", healthRoutes);
app.use("/swagger", swaggerRoutes);
app.use("/assistance", assistanceRoutes);

// start node server
const port = process.env.PORT || global.gConfig.port;

app.use(cors({ credentials: true, origin: UI_BASE_URL }));

const isLocal = cfEnv.getAppEnv().isLocal;
const authconfig = getLocalConfig();
configureSecurity();

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

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

app.get(
    "/auth/login",
    passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
        successRedirect: UI_BASE_URL + "/dashboard",
        forceLogin: true,
    })
);

app.get(CALLBACK_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME));

app.get("/auth/logout", function(req, res, next) {
    WebAppStrategy.logout(req);
    res.redirect(UI_BASE_URL);
});

app.get("/auth/logged", (req, res) => {
    let loggedInAs = {};
    if (req.session[WebAppStrategy.AUTH_CONTEXT]) {
        loggedInAs["name"] = req.user.name;
        loggedInAs["email"] = req.user.email;
        loggedInAs["accessToken"] = req.session[WebAppStrategy.AUTH_CONTEXT].accessToken;
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
            console.error(`Required parameter is missing: ${requiredParam}`);
            process.exit(1);
        }
        config[requiredParam] = localConfig[requiredParam];
    });
    config["redirectUri"] = global.gConfig.API_BASE_URL;
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
