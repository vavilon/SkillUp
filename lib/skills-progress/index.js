
module.exports = function (knex) {
    var parse = function (skills) {
        if (!skills) return;
        skills = skills.replace(/{/g, '[');
        skills = skills.replace(/}/g, ']');
        skills = skills.replace(/"\(/g, '{"id": "');
        skills = skills.replace(/\)"/g, '}');
        skills = skills.replace(/},{/g, '} , {');
        skills = skills.replace(/(\S),/g, '$1", "count": ');
        return JSON.parse(skills);
    };

    //query += " skills[" + (j + 1) + "].count = skills[" + (j + 1) + "].count + " + values[i].count + ",";

    var _queryBase = function (userID, skills, values, callback, action) {
        skills = parse(skills);
        var p = {query: "UPDATE users SET ", i: 0, j: 0};
        for (; p.i < values.length; p.i++) {
            for (; p.j < skills.length; p.j++) {
                if (values[p.i].id === skills[p.j].id) {
                    action(p);
                    break;
                }
            }
        }
        p.query = p.query.substring(0, p.query.length - 1); //удаляем последнюю запятую
        p.query += " WHERE id = '" + userID + "';";
        knex.raw(p.query).then(callback).catch(callback);
    };

    var update = function (userID, skills, values, callback) {
        _queryBase(userID, skills, values, callback, function (p) {
            p.query += " skills[" + (p.j + 1) + "].count = " + values[p.i].count + ",";
        });
    };

    var _crementBase = function (userID, skills, values, operation, callback) {
        _queryBase(userID, skills, values, callback, function (p) {
            p.query += " skills[" + (p.j + 1) + "].count = skills[" + (p.j + 1) + "].count " + operation + " " + values[p.i].count + ",";
        });
    };

    var increment = function (userID, skills, values, callback) {
        _crementBase(userID, skills, values, "+", callback);
    };

    var decrement = function (userID, skills, values, callback) {
        _crementBase(userID, skills, values, "-", callback);
    };

    return {
        parse: parse,
        update: update,
        increment: increment,
        decrement: decrement
    };
};