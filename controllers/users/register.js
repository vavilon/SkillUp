var requireTree = require('require-tree');
var config = requireTree('../../config');
var knex = require('knex')(config.get('knex'));
var bookshelf = require('bookshelf')(knex);
var uuid = require('uuid');
var tempID = '';
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
var bcrypt = require('bcryptjs');

module.exports = function(req, res, next) {
    new User()
        .save()
        .then(function() {
            new User({'id': tempID})
                .set({
                    nick: req.body.email + " nick",
                    name: req.body.email + " name",
                    email: req.body.email,
                    pswhash: bcrypt.hashSync(req.body.password)
                })
                .save()
                .then(function(user) {
                    req.logIn(user, function(err) {
                        return err
                            ? next(err)
                            : res.end('/users/1');
                    });
                })
                .catch(function(err) {
                    next(err);
                });
        })
        .catch(function(err) {
            next(err);
        })
    ;
};