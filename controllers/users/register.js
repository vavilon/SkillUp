var requireTree = require('require-tree');
var config = requireTree('../../config');
var knex = require('knex')(config.get('knex'));
var uuid = require('uuid');

var bcrypt = require('bcryptjs');

module.exports = function(req, res, next) {

    var u = {
        id: uuid.v4(),
        nick: req.body.nick,
        name: req.body.name,
        email: req.body.email,
        pswhash: bcrypt.hashSync(req.body.password)
    };

    knex('users').insert(u)
        .then(function() {
            knex.select('*').from('users').where({id: u.id})
                .then(function(user) {
                    req.logIn(user[0], function (err) {
                        return err
                            ? next(err)
                            : res.end('/users/' + user[0].id);
                    });
                })
                .catch(function(err) {
                    next(err);
                });
        })
        .catch(function(err) {
            res.end();
            next(err);
        });

};