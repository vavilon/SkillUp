module.exports = function(knex) {
    return function (req, res, next) {
        if (req.user.role !== 'пользователь') {
            knex(req.params.table).count('id').then(function (data) {
                res.end(JSON.stringify(data[0].count));
            }).catch(function (error) {
                console.log(error);
                res.error(error);
            });
        } else {
            console.log('Попытка получить доступ без прав админитратора');
            res.error('Попытка получить доступ без прав админитратора');
        }
    }
};