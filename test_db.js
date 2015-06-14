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

knex('solutions').where('id', '=', req.body.solution_id).select('checked_correct', 'checked_incorrect')
    .then(function(rows) {
        console.log(rows);
        return;
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
