var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var KnexSessionStore = require('connect-session-knex')(session);
var requireTree = require('require-tree');
var controllers = requireTree('./controllers');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require(__dirname + '/config');
var exSkills = require(__dirname + '/lib/ex-skills');
var knex = require('knex')(config.get('knex'));
var types = require('pg').types;
//Преобразование bigInt(которые возращает knex в результате некоторых функций в виде строк) в Int
types.setTypeParser(20, 'text', parseInt);
var bcrypt = require('bcryptjs');

knex.idsToRecord = function (ids) {
    var res = "(";
    for (var i in ids) res += " '" + ids[i] + "',"
    return res.substring(0, res.length - 1) + ")";
};

var cors = require('cors');
var util = require('util');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(config.get('nodemailer'));
var updateArray = require(__dirname + '/lib/update-array')(knex);
var updateApprovement = require(__dirname + '/lib/update-approvement')(knex);
var userHasSkills = require(__dirname + '/lib/user-has-skills');

var app = express();
app.use(cors());

var FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "490483854451281";
var FACEBOOK_APP_SECRET = "387964dc2fbee4a25aace154e3df1c1d";

GLOBAL.COUNT_TO_APPROVE = 3;
GLOBAL.COUNT_TO_CHECK = 3;
GLOBAL.CORRECT_CONSTANT = 2 / 3;
GLOBAL.CORRECT_TASK_EXP_MULTIPLIER = 3;
GLOBAL.INCORRECT_TASK_EXP_DIVIDER = 2;
GLOBAL.APPROVE_SKILLS_MULTIPLIER = 0.25;
GLOBAL.CHECK_SKILLS_MULTIPLIER = 0.25;

knex('skills').then(function (rows) {
    GLOBAL.exs = new exSkills(rows);
    var skillsCount = Object.keys(exs.skills).length;
    var updatedSkillsCount = 0;
    for (var i in exs.skills) {
        knex('skills').where('id', '=', exs.skills[i].id).update({exp: exs.skills[i].exp}).then(function () {
            updatedSkillsCount++;
        }).catch(function (err) {
            console.log(err);
        });
    }
    function checkIfSkillsUpdated() {
        if (updatedSkillsCount < skillsCount) {
            console.log('Updating skills exp: ' + Math.floor(updatedSkillsCount / skillsCount * 100) + '%');
            console.log('\033[2A'); //Сдвигает курсор на две строки вверх
            setTimeout(checkIfSkillsUpdated, 100);
        }
        else console.log('Exp for all skills updated!');
    }
    checkIfSkillsUpdated();
});

app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));

var store = new KnexSessionStore({
    knex: knex
});

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: store
}));

//Подключим и настроим стратегию авторизации
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function (email, password, done) {
    knex('users').where('email', '=', email.toLowerCase()).then(function (users) {
        if (users.length) {
            return bcrypt.compareSync(password, users[0].pswhash)
                ? done(null, users[0])
                : done(null, false, {message: 'Incorrect password.'});
        } else done(null, false, {message: 'User not found.'});
    }).catch(function (err) {
        done(null, false, {message: 'Incorrect email.'});
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
    knex('users').where('id', id).then(function (users) {
        done(null, users[0]);
    }).catch(function (err) {
        done(err);
    });
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/front', express.static(__dirname + '/front'));

app.use('/db', function (req, res, next) {
    if (req.isAuthenticated()) {
        if (req.path === '/skills') {
            knex('skills').then(function (rows) {
                res.end(JSON.stringify(rows));
            });
        }
        else if (req.path === '/tasks') {
            controllers.db.tasks(knex, req, res, next);
        }
        else if (req.path === '/users') {
            controllers.db.users(knex, req, res, next);
        }
        else if (req.path === '/solutions') {
            controllers.db.solutions(knex, req, res, next);
        }
        else next();
    }
    else next();
});

//Получение информации о колонках в таблице (значение по умолчанию, тип, макс. длину, нулл?)
app.use('/db/:table/columns', controllers.db.columns(knex));
//Получение количества строк в таблице
app.use('/db/:table/rows_count', controllers.db.rows_count(knex));

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
app.use('/logged_user', function (req, res, next) {
    if (req.isAuthenticated()) {
        req.body.id = req.user.id;
        controllers.db.users(knex, req, res, next);
    }
    else res.end();
});
app.use('/check_nick', function (req, res) {
    knex('users').where('nick', req.body.nick).then(function (users) {
        if (users.length) {
            console.log("User with nick '" + req.body.nick + "' already exists!");
            res.end();
        }
        else {
            res.end('ok');
        }
    }).catch(function (err) {
        console.log(err);
        res.end();
    });
});
app.use('/check_email', function (req, res) {
    knex('users').where('email', req.body.email.toLowerCase()).then(function (users) {
        if (users.length) {
            console.log("User with email '" + req.body.email + "' already exists!");
            res.end();
        }
        else {
            res.end('ok');
        }
    }).catch(function (err) {
        console.log(err);
        res.end();
    });
});

app.post('/restore', function (req, res) {
    var secretCode = Math.round(Math.random() * 10000);
    transporter.sendMail({
        from: 'SkillUP <vintorezvs@gmail.com>',
        to: req.body.email,
        subject: 'Восстановление пароля',
        text: 'Код для смены пароля: ' + secretCode
    }, function (err) {
        if (err) {
            console.log(err);
            res.end('error');
        }
        else res.end('' + secretCode);
    });
});

app.post('/change_password', function (req, res) {
    knex('users').where('email', '=', req.body.email.toLowerCase()).update('pswhash', bcrypt.hashSync(req.body.password))
        .then(function () {
            controllers.users.login(req, res);
        }).catch(function (err) {
            console.log(err);
            res.end();
        });
});

app.post('/create_task', controllers.tasks.create(knex, updateArray, userHasSkills));

app.post('/solve_task', controllers.tasks.solve(knex));

app.post('/like_task', controllers.tasks.like(knex, updateArray));

app.post('/receive_task', controllers.tasks.receive(knex, updateArray));

app.post('/approve_task', controllers.tasks.approve(knex, updateApprovement, userHasSkills));

app.post('/like_solution', controllers.solutions.like(knex, updateArray));

app.post('/check_solution', controllers.solutions.check(knex, userHasSkills));

app.post('/append_needs', function (req, res, next) {
    if (req.isAuthenticated()) {
        //Переделать!!!
        knex('users').where('id', '=', req.user.id).update({needs: req.body.needs}).then(function () {
            res.end('ok');
        }).catch(function (error) {
            console.log(error);
            res.end();
        });
    } else res.end();
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
        ).then(function () {
            res.end('ok');
        }).catch(function (error) {
            console.log(error);
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
}, function (req, res) { /* Never called */
});

app.get('/auth/facebook/callback', function (req, res, next) {
    passport.authenticate('facebook', function (err, user, info) {
        if (err) return next(err);
        if (!user) return res.redirect('/main');
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            if (info) {
                return res.redirect('/registration/step2');
            }
            return res.redirect('/users/' + user.id);
        });
    })(req, res, next);
});

//Привяжем запросы к соответствующим контроллерам
app.post('/login', controllers.users.login);
app.post('/register', controllers.users.register);
app.get('/logout', controllers.users.logout);
app.post('/update_profile', controllers.users.update(knex));

app.use('/', function (req, res) {
    res.sendFile(__dirname + '/front/index.html');
});

var server = app.listen(config.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);
});