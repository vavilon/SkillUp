var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var requireTree = require('require-tree');
var controllers = requireTree('./controllers');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require(__dirname + '/config');
var getJson = require(__dirname + '/get-json');
var exSkills = require(__dirname + '/ex-skills');
var parseSP = require(__dirname + '/parse-skills-progress');
var knex = require('knex')(config.get('knex'));
var bookshelf = require('bookshelf')(knex);
var cors = require('cors');
var util = require('util');

var pg = require('pg');
var conObj = config.get('knex').connection;
var conString = "postgres://" + conObj.user + ":" + conObj.password + "@" + conObj.host + "/" + conObj.database;

var app = express();
app.use(cors());

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

var exs = {};

knex.select().from('skills').then(function (rows) {
    exs = new exSkills(rows);
    for (var i in exs.skills) {
        knex('skills').where('id', '=', exs.skills[i].id).update({exp: exs.skills[i].exp}).then(function () {
        });
    }
    console.log('Exp for all skills updated!');
});

var bcrypt = require('bcryptjs');

//app.all('*', function (req, res) {
//    res.sendFile(__dirname + '/front/index.html');
//});

app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));
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
    controllers.social.facebook.strategy));

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
    new User({'nick': nick})
        .fetch()
        .then(function (user) {
            if (user) {
                console.log("User with nick '" + nick + "' already exists!");
                res.end();
            }
            else {
                res.end('ok');
            }
        })
        .catch(function (err) {
            console.log(err);
            res.end();
        });
});
app.use('/check_email', function (req, res) {
    var email = req.body.email;
    new User({'email': email})
        .fetch()
        .then(function (user) {
            if (user) {
                console.log("User with email '" + email + "' already exists!");
                res.end();
            }
            else {
                res.end('ok');
            }
        })
        .catch(function (err) {
            console.log(err);
            res.end();
        });
});

app.post('/create_task', function (req, res, next) {
    if (req.isAuthenticated()) {

        if (!req.user.attributes.admin) {
            var skills = parseSP(req.user.attributes.skills);
            var found = false;
            var i = null, j = null;
            var temp = null;
            for (i in req.body.skills) {
                found = false;
                for (j in skills) {
                    if (req.body.skills[i] == skills[j].id) {
                        temp = skills[j];
                        found = true;
                        break;
                    }
                }
                if (found) {
                    if (temp.count < exs.skills[req.body.skills[i]].count_to_get) {
                        console.log('Not enough level of skill!');
                        res.end();
                        return;
                    }
                }
                else {
                    console.log('User doesnt have those skill!');
                    res.end();
                    return;
                }
            }
        }

        var exp = 0;
        for (i in req.body.skills) {
            exp += exs.skills[req.body.skills[i]].exp;
        }

        knex('tasks').insert({
            title: req.body.title,
            description: req.body.description,
            skills: req.body.skills,
            exp: exp,
            author: req.user.attributes.id
        }).then(function () {
            res.end('ok')
                .catch(function (error) {
                    res.end();
                });
        });
    } else res.end();
});

app.post('/create_solution', function (req, res, next) {
    if (req.isAuthenticated()) {
        //Добавить проверку, решал ли пользователь такое задание!!!
        var id = uuid.v4();
        knex('solutions').insert({
            id: id,
            task_id: req.body.task_id,
            user_id: req.user.id,
            content: req.body.content
        }).then(function () {
            pg.connect(conString, function (err, client, done) {
                if (err) {
                    return console.error('error fetching client from pool', err);
                }
                client.query("UPDATE users SET tasks_done = tasks_done || '{" + id + "}' WHERE id = '" + req.user.id + "';",
                    function (err, result) {
                        done(client);
                        if (err) {
                            return console.error('error running query', err);
                        }
                        res.end('ok');
                        console.log(result);
                    });
            });
        }).catch(function (error) {
            res.end();
        });
    }
    else res.end();
});

app.post('/register/step2', function (req, res, next) {
    if (req.isAuthenticated()) {
        knex('users').where('id', '=', req.user.id).update(
            {
                avatar: req.body.avatar,
                birthday: req.body.birthday,
                gender: req.body.gender,
                city: req.body.city,
                country: req.body.country,
                education: req.body.education,
                work: req.body.work
            }
        )
            .then(function () {
                res.end('ok');
            })
            .catch(function (error) {
                res.end();
            });
    }
    else res.end();
});

app.get('/auth/facebook', function (req, res, next) {
    passport.authenticate('facebook', {
        scope: ['email',
            'user_birthday',
            'user_education_history',
            'user_location',
            'user_photos',
            'user_work_history',
            'user_about_me']
    })(req, res, next);
}, function (req, res) {/* Never called */
});

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {failureRedirect: '/main'}),
    function (req, res) {
        res.redirect('/users/' + req.user.id);
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