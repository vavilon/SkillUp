var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var requireTree = require('require-tree');
var controllers = requireTree('./controllers');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require(__dirname + '/config');
var knex = require('knex')(config.get('knex'));
var bookshelf = require('bookshelf')(knex);

var FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "490483854451281";
var FACEBOOK_APP_SECRET = "387964dc2fbee4a25aace154e3df1c1d";

var uuid = require('uuid');

var User = bookshelf.Model.extend({
    tableName: 'users'
});
var Skill = bookshelf.Model.extend({
    tableName: 'skills'
});
var Task = bookshelf.Model.extend({
    tableName: 'tasks'
});
var Solution = bookshelf.Model.extend({
    tableName: 'solutions'
});

var bcrypt = require('bcryptjs');

//app.all('*', function (req, res) {
//    res.sendFile(__dirname + '/front/index.html');
//});

app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//Подключим и настроим стратегию авторизации
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function (email, password, done) {
    new User({'email': email})
        .fetch()
        .then(function (user) {
            return bcrypt.compareSync(password, user.get('pswhash'))
                ? done(null, user)
                : done(null, false, {message: 'Incorrect password.'})
        })
        .catch(function (err) {
            console.log(err);
            done(null, false, {message: 'Incorrect username.'});
        });
}));

passport.use(new FacebookStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost/auth/facebook/callback"
    },
    function (token, refreshToken, profile, done) {
        new User({'id_facebook': profile.id}).fetch().then(function (user) {
            if (user) {
                return done(null, user); // user found, return that user
            } else {
                var u = {
                    id: uuid.v4(),
                    nick: profile.emails[0].value.split('@')[0],
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    pswhash: bcrypt.hashSync('facebook'),
                    id_facebook: profile.id
                };

                knex('users').insert(u)
                    .then(function () {
                        new User({'id': u.id})
                            .fetch()
                            .then(function (user) {
                                return done(null, user);
                            })
                            .catch(function (err) {
                                done(err);
                            });
                    })
                    .catch(function (err) {
                        done(err);
                    });
            }
        })
            .catch(function (err) {
                done(err);
            });
    }));

//Для того, чтобы сохранять или доставать пользовательские данные из сессии, паспорт использует функции
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    new User({'id': id})
        .fetch()
        .then(function (user) {
            done(null, user);
        })
        .catch(function (err) {
            done(err);
        });
});

//Проверка авторизации
var mustAuthenticated = function (req, res, next) {
    req.isAuthenticated()
        ? next()
        : res.end('/main');
};

// Passport:
app.use(passport.initialize());
app.use(passport.session());

app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/front', express.static(__dirname + '/front'));

app.use('/db', function (req, res) {
    if (req.isAuthenticated()) {
        if (req.path === '/skills') {
            new Skill().fetchAll().then(function (model) {
                res.end(JSON.stringify(model));
            });
        }
        else if (req.path === '/tasks') {
            new Task().fetchAll().then(function (model) {
                res.end(JSON.stringify(model));
            });
        }
        else if (req.path === '/users') {
            new User().fetchAll().then(function (model) {
                res.end(JSON.stringify(model));
            });
        }
        else if (req.path === '/solutions') {
            new Solution().fetchAll().then(function (model) {
                res.end(JSON.stringify(model));
            });
        }
    }
    else res.end();
});
app.use('/avatars', function (req, res) {
    if (req.isAuthenticated()) {
        try {
            res.sendFile(__dirname + '/avatars' + req.path);
        }
        catch (e) {
            console.log('Avatar not found!');
        }
    }
    else res.end();
});
app.use('/is_logged_in', function (req, res) {
    if (req.isAuthenticated()) {
        res.end(JSON.stringify(req.user.attributes));
    }
    else res.end();
});
app.use('/check_nick', function (req, res) {
    var nick = req.body.nick;
    console.log("Checking nick '" + nick + "'...");
    new User({'nick': nick})
        .fetch()
        .then(function (user) {
            if (user) {
                console.log("User with nick '" + nick + "' already exists!");
                res.end();
            }
            else {
                console.log("Nick '" + nick + "' is free!");
                res.end('ok');
            }
        })
        .catch(function (err) {
            console.log("Nick '" + nick + "' is free!");
            res.end('ok');
        });
});
app.use('/check_email', function (req, res) {
    var email = req.body.email;
    console.log("Checking email '" + email + "'...");
    new User({'email': email})
        .fetch()
        .then(function (user) {
            if (user) {
                console.log("User with email '" + email + "' already exists!");
                res.end();
            }
            else {
                console.log("Email '" + email + "' is free!");
                res.end('ok');
            }
        })
        .catch(function (err) {
            console.log("Email '" + email + "' is free!");
            res.end('ok');
        });
});

app.get('/auth/facebook',
        passport.authenticate('facebook', {scope: ['email', 'user_birthday', 'user_likes']}),
    function (req, res) {

    });

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {failureRedirect: '/main'}),
    function (req, res) {
        res.redirect('/');
    });

//Привяжем запросы к соответствующим контроллерам
app.post('/login', controllers.users.login);
app.post('/register', controllers.users.register);
app.get('/logout', controllers.users.logout);
app.use('/', function (req, res) {
    res.sendFile(__dirname + '/front/index.html');
});


var server = app.listen(config.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);
});