//var fs = require('fs');
//var obj = JSON.parse(fs.readFileSync('skills.json', 'utf8'));
//var uuid = require('uuid');
var bcrypt = require('bcryptjs');
var config = require(__dirname + '/config');
var knex = require('knex')(config.get('knex'));
//var bookshelf = require('bookshelf')(knex);
//var temp;

/*knex('approvements').returning('id').insert({task_id: 'cf133be1-3e14-4678-acce-821684098d79'})
    .then(function(id) {
        console.log(id);
        return;
    });*/

var q = knex('tasks').andWhere('skills', '&&', ['233955be-12bb-497d-93fa-b924742930f1', 'd568fd77-26e2-4226-9554-924af817c71e']);

q.then(function(rows) {
    console.log(rows);

}).catch(function (error) {
    console.log(error);
    res.end();
});

/*
var User = bookshelf.Model.extend({
    tableName: 'users',
    defaults: {
        id: temp = uuid.v4(),
        nick: '',
        name: '',
        email: '',
        pswhash: ''
    }
});

new User()
    .save()
    .then(function() {
        new User({'id': temp})
            .set({
                nick: 'nick11',
                name: 'fsdfsadfasdf',
                email: 'sdfasdfadf',
                pswhash: '111'
            })
            .save()
            .then(function(model) {
                console.log(model.get('name'));
            });
    });
*/
