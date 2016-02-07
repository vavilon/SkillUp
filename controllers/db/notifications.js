module.exports = function (knex, req, res, next) {
    /* Уведомление, описание, какие дополнительные поля будут использованы при конкретном виде уведомления
     'your_task_solved' (ваше задание решили): solution_id
     'your_solution_checked' (ваше решение проверили): solution_id, other_user_id
     'solution_checked' (проверили решение, которое вы проверили): solution_id, other_user_id
     'task_approved' (подтвердили задание, которое вы подтвердили): approvement_id
     'task_created' (ваше задание подтвердили): approvement_id
     'your_solution_checked_full' (ваше решение подтвердили полностью): solution_id
     'solution_checked_full' (полностью проверили решение, которое вы проверили): solution_id
     'task_approved_full' (полностью подтвердили задание, которое вы подтвердили): task_id
     'task_created_full' (ваше задание полностью подтвердили): task_id
     'task_liked' (ваше задание лайкнули): task_id, other_user_id
     'solution_liked' (ваше решение лайкнули): solution_id, other_user_id
     'task_commented' (ваше задание прокомментили): task_id (в comments неизвестно, на какую таблицу ссылается src), comment_id
     'solution_commented' (ваше решение прокомментили): solution_id (^ аналогично ^), comment_id
     'task_received' (ваше задание взяли): task_id, other_user_id
     'user_subscribed' (на вас подписался пользователь): other_user_id
     'skill_up' (уровень вашего умения поднялся): skill_id
     'comment_liked' (ваш комментарий лайкнули): comment_id, other_user_id
     'comment_replied' (на ваш комментарий ответили): comment_id, other_comment_id
     'sub_task_solved' (ваш друг решил задание): solution_id
     'sub_solution_checked' (ваш друг проверил решение): solution_id, other_user_id
     'sub_task_approved' (ваш друг подтвердил задание): approvement_id
     'sub_task_created' (ваш друг создал задание): task_id
     'sub_task_solved_full' (полностью проврелили решение вашего друга): solution_id
     'sub_solution_checked_full' (полностью проверили решение, которое проверил ваш друг): solution_id, other_user_id
     'sub_task_approved_full' (полностью подтвердили  задание, которое подтвердил ваш друг): task_id, other_user_id
     'sub_task_created_full' (полностью подтвердили задание вашего друга): task_id
     'sub_skill_up' (? уровень умения вашего друга поднялся ? вопрос аналогичный с skill_up): skill_id, other_user_id
     */
};
