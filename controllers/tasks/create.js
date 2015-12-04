
module.exports = function(knex, updateArray, userHasSkills){
    function callback (exp, req, res, next) {
        //Вставляем новое задание
        knex('tasks').returning('id').insert({
            title: req.body.title,
            description: req.body.description,
            skills: req.body.skills,
            exp: exp,
            author: req.user.id,
            links: req.body.links
        }).then(function (taskID) {
            //Добавляем запись в таблицу approvements для нового задания
            knex('approvements').insert({task_id: taskID[0]}).then(function() {
                //Добавляем автору id нового задания в массив tasks_created
                updateArray('users', 'tasks_created', req.user.id, 'append', taskID[0]).then(function () {
                    res.end('ok');
                }).catch(function (error) {
                    console.log(error);
                    res.end();
                });
            }).catch(function (error) {
                console.log(error);
                res.end();
            });
        }).catch(function (error) {
            console.log(error);
            res.end();
        });
    }

    return function (req, res, next) {
        if (req.isAuthenticated()) {
            //Рассчитываем экспу для задания
            var exp = 0;
            for (var i in req.body.skills) {
                exp += GLOBAL.exs.skills[req.body.skills[i]].exp;
            }
            if (!req.user.admin) {
                //Проверяем, хватает ли у автора експы на случай некорректности задания
                if (req.user.exp < exp / GLOBAL.INCORRECT_TASK_EXP_DIVIDER) res.end();
                else knex('skills_progress').where('user_id', '=', req.user.id).select('skill_id as id', 'count')
                    .then(function(userSkills) {
                        if (!userHasSkills(userSkills, req.body.skills)) {
                            res.end();
                        }
                        else callback(exp, req, res, next);
                    }).catch(function (error) {
                        console.log(error);
                        res.end();
                    });
            }
            else callback(exp, req, res, next);
        } else res.end();
    };
};