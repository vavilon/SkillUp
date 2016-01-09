var getJson = require('../../../lib/get-json');
var requireTree = require('require-tree');
var config = requireTree('../../../config');
var knex = require('knex')(config.get('knex'));
var bcrypt = require('bcryptjs');

module.exports = function (token, refreshToken, profile, done) {
    process.nextTick(function () {
        knex('users').where('id_facebook', profile.id).then(function (users) {
            var user = users[0];
            var email = profile.emails[0].value.toLowerCase();
            if (user) {
                return done(null, user);
            } else {
                knex('users').where('email', email).then(function (rows) {
                    var emailExists = rows.length != 0;
                    var query = knex('users').returning('id');

                    if (!emailExists) {
                        var options = {
                            host: 'graph.facebook.com',
                            port: 443,
                            path: '/' + profile.id + '?access_token=' + token + '&locale=ru_RU',
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        };

                        getJson(options, function (statusCode, result) {
                            var u = {
                                nick: email.split('@')[0],
                                name: profile.displayName,
                                email: email,
                                pswhash: bcrypt.hashSync('facebook'),
                                id_facebook: profile.id
                            };

                            try {
                                u.avatar = "https://graph.facebook.com/" + profile.id + "/picture" + "?width=9999" + "&access_token=" + token;
                            } catch (e) {
                            }
                            try {
                                if (result.birthday) u.birthday = new Date(result.birthday);
                            } catch (e) {
                            }
                            try {
                                if (result.gender) u.gender = result.gender;
                            } catch (e) {
                            }
                            if (result.location) {
                                try {
                                    u.country = result.location.name.split(', ')[1];
                                } catch (e) {
                                }
                                try {
                                    u.city = result.location.name.split(', ')[0];
                                } catch (e) {
                                }
                            }
                            if (result.education) {
                                try {
                                    u.education = JSON.stringify(result.education);
                                } catch (e) {
                                }
                            }
                            if (result.work) {
                                try {
                                    u.work = JSON.stringify(result.work);
                                } catch (e) {
                                }
                            }
                            query.insert(u).then(function (ids) {
                                knex('users').where('id', ids[0]).then(function (users) {
                                    return done(null, users[0], {message: 'first'});
                                }).catch(function (err) {
                                    done(err);
                                });
                            }).catch(function (err) {
                                done(err);
                            });
                        });
                    }
                    else {
                        query.update({id_facebook: profile.id}).where('email', email).then(function (ids) {
                            knex('users').where('id', ids[0]).then(function (users) {
                                return done(null, users[0]);
                            }).catch(function (err) {
                                done(err);
                            });
                        }).catch(function (err) {
                            done(err);
                        });
                    }
                });
            }
        }).catch(function (err) {
            done(err);
        });
    });
};