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
var User = bookshelf.Model.extend({ tableName: 'users' });


//Проверка авторизации
var mustAuthenticated = function (req, res, next){
    req.isAuthenticated()
        ? next()
        : res.redirect('/main');
};


app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/front', express.static(__dirname + '/front'));
app.use('/models', express.static(__dirname + '/models'));
app.all('*', function (req, res) {
    res.sendFile(__dirname + '/front/index.html');
});

//Привяжем запросы к соответствующим контроллерам
app.post('/login', function(req, res, next) {

    console.log('someone trying to login');

    passport.authenticate('local',
        function(err, user) {
            console.log('user:', user);
            return err
                ? next(err)
                : user
                ? req.logIn(user, function(err) {
                return err
                    ? next(err)
                    : res.redirect('/users/1');
            })
                : res.redirect('/main');
        }
    )(req, res, next);
});
app.post('/register', controllers.users.register);
app.get('/logout', controllers.users.logout);
app.all('/users/*', mustAuthenticated);

//Подключим и настроим стратегию авторизации
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function(email, password,done){
    new User({'email': email})
        .fetchOne()
        .then(function(user) {
            return password === user.pswhash
                ? done(null, user)
                : done(null, false, { message: 'Incorrect password.' })
        })
        .catch(function(err) {
            console.log(err);
            done(null, false, { message: 'Incorrect username.' });
        });
}));

// Middlewares, которые должны быть определены до passport:
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

// Passport:
app.use(passport.initialize());
app.use(passport.session());

//Для того, чтобы сохранять или доставать пользовательские данные из сессии, паспорт использует функции
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    new User({'id':id})
        .fetchOne()
        .then(function(user) {
            done(null,user);
        })
        .catch(function(err) {
            done(err);
        });
});

var server = app.listen(config.get('port'), function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);
});