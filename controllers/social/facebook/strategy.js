
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
                var avatar = "https://graph.facebook.com/" + profile.id + "/picture" + "?width=9999" + "&access_token=" + token;
                knex('users').where('id_facebook', '=', profile.id).update({avatar: avatar})
                    .then(function() {
                        return done(null, user);
                    })
                    .catch(function (error) {
                        done(error);
                    });
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
                        if (result.birthday) u.birthday = new Date(result.birthday);
                    } catch (e) { }
                    try {
                        if (result.gender) u.gender = result.gender;
                    } catch (e) { }
                    if (result.location) {
                        try {
                            u.country = result.location.name.split(', ')[1];
                        } catch (e) { }
                        try {
                            u.city = result.location.name.split(', ')[0];
                        } catch (e) { }
                    }
                    if (result.education) {
                        try {
                            u.education = JSON.stringify(result.education);
                        } catch (e) { }
                    }
                    if (result.work) {
                        try {
                            u.work = JSON.stringify(result.work);
                        } catch (e) { }
                    }

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