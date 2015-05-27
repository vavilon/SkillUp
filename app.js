var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var requireTree = require('require-tree');
var controllers = requireTree('./controllers');
var passport       = require('passport');
var LocalStrategy  = require('passport-local').Strategy;
var config = require(__dirname + '/config');
var knex = require('knex')(config.get('knex'));
var bookshelf = require('bookshelf')(knex);
var uuid = require('uuid');
var tempID;
var User = bookshelf.Model.extend({
    tableName: 'users',
    defaults: {
        id: tempID = uuid.v4(),
        nick: '',
        name: '',
        email: '',
        pswhash: ''
    }
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

// Middlewares, которые должны быть определены до passport:
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
}, function(email, password, done){
    new User({'email': email})
        .fetch()
        .then(function(user) {
            return bcrypt.compareSync(password, user.get('pswhash'))
                ? done(null, user)
                : done(null, false, { message: 'Incorrect password.' })
        })
        .catch(function(err) {
            console.log(err);
            done(null, false, { message: 'Incorrect username.' });
        });
}));

//Для того, чтобы сохранять или доставать пользовательские данные из сессии, паспорт использует функции
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    new User({'id':id})
        .fetch()
        .then(function(user) {
            done(null,user);
        })
        .catch(function(err) {
            done(err);
        });
});

//Проверка авторизации
var mustAuthenticated = function (req, res, next){
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
            new Skill().fetchAll().then(function(model){
                res.end(JSON.stringify(model));
            });
        }
        else if (req.path === '/tasks') {
            new Task().fetchAll().then(function(model){
                res.end(JSON.stringify(model));
            });
        }
        else if (req.path === '/users') {
            new User().fetchAll().then(function(model){
                res.end(JSON.stringify(model));
            });
        }
        else if (req.path === '/solutions') {
            new Solution().fetchAll().then(function(model){
                res.end(JSON.stringify(model));
            });
        }
    }
    else res.end();
});
app.use('/avatars', function (req, res) {
    if (req.isAuthenticated()) {
        res.sendFile(__dirname + '/avatars' + req.path);
    }
    else res.end();
});
app.use('/is_logged_in', function (req, res) {
    if (req.isAuthenticated()) {
        res.end(JSON.stringify(req.user.attributes));
    }
    else res.end();
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