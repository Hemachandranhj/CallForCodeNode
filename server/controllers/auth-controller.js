const express = require("express");
const session = require("express-session");
const passport = require("passport");
const nconf = require("nconf");
const appID = require("ibmcloud-appid");

const helmet = require("helmet");
const express_enforces_ssl = require("express-enforces-ssl");
const cfEnv = require("cfenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const WebAppStrategy = appID.WebAppStrategy;
const userAttributeManager = appID.UserAttributeManager;
const UnauthorizedException = appID.UnauthorizedException;

const LOGIN_URL = "/ibm/bluemix/appid/login";
const CALLBACK_URL = "/ibm/bluemix/appid/callback";

const UI_BASE_URL = "http://localhost:4200";

var app = express();
app.use(cors({ credentials: true, origin: UI_BASE_URL }));

const isLocal = cfEnv.getAppEnv().isLocal;
const config = getLocalConfig();
// configureSecurity();

// Setup express application to use express-session middleware
// Must be configured with proper session storage for production
// environments. See https://github.com/expressjs/session for
// additional documentation
// app.use(session({
//   secret: 'keyboardcat',
//   resave: true,
//   saveUninitialized: true,
//   proxy: true,
//   cookie: {
//     httpOnly: true,
//     secure: !isLocal,
//     maxAge: 600000000,
//   },
// }));

// // Configure express application to use passportjs
// app.use(passport.initialize());
// app.use(passport.session());


// let webAppStrategy = new WebAppStrategy(config);
// passport.use(webAppStrategy);

// userAttributeManager.init(config);

// Configure passportjs with user serialization/deserialization. This is required
// for authenticated session persistence accross HTTP requests. See passportjs docs
// for additional information http://passportjs.org/docs
passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});


// User login
exports.login = (req, res) => {
    console.log("In auth controller - login");
    passport.authenticate(WebAppStrategy.STRATEGY_NAME,
        { successRedirect: UI_BASE_URL, forceLogin: true });
};


// Callback to finish the authorization process. Will retrieve access and identity tokens/
// from AppID service and redirect to either (in below order)
// 1. the original URL of the request that triggered authentication, as persisted in HTTP session under WebAppStrategy.ORIGINAL_URL key.
// 2. successRedirect as specified in passport.authenticate(name, {successRedirect: "...."}) invocation
// 3. application root ("/")
exports.callbackAuthorization = (req, res) => {
    console.log("In auth controller - callbackAuthorization");
    passport.authenticate(WebAppStrategy.STRATEGY_NAME,
        { allowAnonymousLogin: true });
};

exports.logout = (req, res, next) => {
    console.log("In auth controller - logout");
    WebAppStrategy.logout(req);
    res.redirect(UI_BASE_URL);
};

exports.logged = (req, res) => {
    let loggedInAs = {};
    if (req.session[WebAppStrategy.AUTH_CONTEXT]) {
        loggedInAs["name"] = req.user.name;
        loggedInAs["email"] = req.user.email;
    }

    res.send({
        logged: !!req.session[WebAppStrategy.AUTH_CONTEXT],
        loggedInAs: loggedInAs,
    });
};

// function isLoggedIn(req, res, next) {
//   if (req.session[WebAppStrategy.AUTH_CONTEXT]) {
//     next();
//   } else {
//     res.redirect(UI_BASE_URL);
//   }
// }
// app.use('/user/*', isLoggedIn);


function getLocalConfig() {
// const config = require('../config/authConfig.json')
    if (!isLocal) {
        return {};
    }
    let config = {};
    const port = process.env.PORT || global.gConfig.port;
    const localConfig = nconf.env().file("./server/config/authConfig.json").get();
    const requiredParams = ["clientId", "secret", "tenantId", "oauthServerUrl", "profilesUrl"];
    requiredParams.forEach(function(requiredParam) {
        if (!localConfig[requiredParam]) {
            //   console.error('When running locally, make sure to create a file
            //   *config.json* in the root directory. See config.template.json for an
            //   example of a configuration file.');
            console.error(`Required parameter is missing: ${requiredParam}`);
            process.exit(1);
        }
        config[requiredParam] = localConfig[requiredParam];
    });
    config["redirectUri"] = `http://localhost:${port}${CALLBACK_URL}`;
    return config;
}


// function configureSecurity() {
//   app.use(helmet());
//   app.use(cookieParser());
//   app.use(helmet.noCache());
//   app.enable('trust proxy');
//   if (!isLocal) {
//     app.use(express_enforces_ssl());
//   }
// }
