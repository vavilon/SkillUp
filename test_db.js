//var fs = require('fs');
//var obj = JSON.parse(fs.readFileSync('skills.json', 'utf8'));
//var uuid = require('uuid');
var bcrypt = require('bcryptjs');
var config = require(__dirname + '/config');
var knex = require('knex')(config.get('knex'));
//var bookshelf = require('bookshelf')(knex);
//var temp;

/*knex('users').update({birthday: new Date("1995-02-12T22:00:00.000Z")}).where('id', '103').returning('*').then(function(user) {
 knex('users').select('birthday').where('id', '103').then(function(rows) {
 console.log(rows[0].birthday);
 }).catch(function (error) {
 console.log(error);
 });
 }).catch(function (error) {
 console.log(error);
 });*/

/*knex('tasks').then(function (tasks) {
 var max = 0.65, min = 0.1;
 for (var i in tasks) {
 var task = tasks[i];
 for (var j in task.skills) {
 knex('task_skills').insert({
 task_id: task.id,
 skill_id: task.skills[j],
 count: (Math.random() * (max - min) + min).toFixed(2)
 }).returning('*').then(function (rows) {
 console.log('Task: ' + rows[0].task_id + ', skill: ' + rows[0].skill_id + ', count: ' + rows[0].count);
 }).catch(function (error) {
 console.log(error);
 });
 }
 }
 }).catch(function (error) {
 console.log(error);
 });*/

/*knex.select("tasks.*").from(function () {
 this.select("tasks.*").from('tasks').leftJoin('task_skills', 'tasks.id', '=', 'task_skills.task_id')
 .select(knex.raw("array_agg((skill_id, count)) AS skills")).groupBy('tasks.id')
 .select(knex.raw("array_agg(skill_id) AS skills_ids")).as('tasks');
 }).where('tasks.skills_ids', '&&', [57]).then(function (rows) {
 console.log(rows);
 }).catch(function (error) {
 console.log(error);
 });*/

var q = knex.select("solutions.*").from(function() {
    this.select("solutions.*").from('solutions')
        .leftJoin('tasks', 'solutions.task_id', '=', 'tasks.id').select('tasks.title as task_title', 'tasks.exp as task_exp')
        .leftJoin('task_skills', 'solutions.task_id', '=', 'task_skills.task_id').as('tasks')
        .select(knex.raw("array_agg((skill_id, count)) AS skills")).groupBy('tasks.id', 'solutions.id')
        .select(knex.raw("array_agg(skill_id) AS skills_ids")).as('solutions');
});
q.leftJoin('users as u1', 'solutions.user_id', '=', 'u1.id').select('u1.name as user_name');
q.andWhere('solutions.skills_ids', '&&', [54]);
q.then(function (rows) {
    console.log(rows);
}).catch(function (error) {
    console.log(error);
});

/*knex.select("users.*").from('users').leftJoin('skills_progress', 'id', '=', 'user_id').select(knex.raw("array_agg((skill_id, count)) AS skills"))
 .groupBy('id').limit(1).offset(0).then(function(rows) {
 console.log(rows[0]);
 }).catch(function (error) {
 console.log(error);
 });*/

/*knex('users').where('id', 14).update({pswhash: bcrypt.hashSync('1')}).returning('pswhash').then(function (pswhash) {
 console.log(bcrypt.compareSync('1', pswhash[0]));
 });*/

/*knex('approvements').returning('id').insert({task_id: 'cf133be1-3e14-4678-acce-821684098d79'})
 .then(function(id) {
 console.log(id);
 return;
 });*/

/*    var q = knex.select("tasks.*").from('tasks');
 q.join('users', 'tasks.author', '=', 'users.id').select('users.name as author_name');
 q.limit(10).offset(0);

 q.then(function(rows) {
 console.log(rows);

 }).catch(function (error) {
 console.log(error);
 });*/

/*knex.raw("UPDATE solutions SET is_correct = true WHERE id = '248ab5b8-52a7-4a6a-8f25-0927cab2dec4' RETURNING likes, checked_correct, checked_incorrect;")
 .then(function(ans) {
 console.log(ans.rows);
 });*/

/*skillsProgress.increment(['2178d930-0365-4962-89f2-58fbfe28c996'],
 '{"(5a0574cc-66b7-4c89-9950-03a2eea0c701,1)","(8b33a559-a0b4-47da-a27e-84439cdecf9c,1)"}',
 [{id: '5a0574cc-66b7-4c89-9950-03a2eea0c701', count: 1}, {id: '8b33a559-a0b4-47da-a27e-84439cdecf9c'}])
 .then(console.log).catch(console.log);*/
/*var a = 0;

 knex.select("users.nick", knex.raw("array_agg((skill_id, count)) AS skills")).from('users')
 .leftJoin('skills_progress', 'id', '=', 'user_id')
 .groupBy('id').then(function (rows) {
 console.log(a);
 clearInterval(id);
 }).catch(console.log);

 var id = setInterval(function () {a++;});*/

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
