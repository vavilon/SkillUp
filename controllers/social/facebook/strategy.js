
var getJson = require('../../../get-json');
var requireTree = require('require-tree');
var config = requireTree('../../../config');
var knex = require('knex')(config.get('knex'));
var bookshelf = require('bookshelf')(knex);
var uuid = require('uuid');
var bcrypt = require('bcryptjs');

var User = bookshelf.Model.extend({
    tableName: 'users'
});

module.exports = function (token, refreshToken, profile, done) {
    process.nextTick(function () {
        new User({'id_facebook': profile.id}).fetch().then(function (user) {
            if (user) {
                return done(null, user); // user found, return that user
            } else {
                var options = {
                    host: 'graph.facebook.com',
                    port: 443,
                    path: '/' + profile.id + '?access_token=' + token + '&locale=ru_RU',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                getJson(options, function(statusCode, result) {
                    var u = {
                        id: uuid.v4(),
                        nick: profile.emails[0].value.split('@')[0],
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        pswhash: bcrypt.hashSync('facebook'),
                        id_facebook: profile.id
                    };

                    try {
                        u.avatar = "https://graph.facebook.com/" + profile.id + "/picture" + "?width=9999" + "&access_token=" + token;
                    } catch (e) { }
                    try {
                        u.birthday = new Date(result.birthday);
                    } catch (e) { }
                    try {
                        u.gender = result.gender;
                    } catch (e) { }
                    try {
                        u.country = result.location.name.split(', ')[1];
                    } catch (e) { }
                    try {
                        u.city = result.location.name.split(', ')[0];
                    } catch (e) { }
                    try {
                        u.education = [];
                        for (var i in result.education) {
                            u.education.push(JSON.stringify(result.education[i]));
                        }
                    } catch (e) { }
                    try {
                        u.work = [];
                        for (i in result.work) {
                            u.work.push(JSON.stringify(result.work[i]));
                        }
                    } catch (e) { }

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
                });
            }
        })
            .catch(function (err) {
                done(err);
            });
    });
};