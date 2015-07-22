
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

    var _queryBase = function (usersIDs, skills, values, action) {
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
        p.query = p.query.substring(0, p.query.length - 1) + " WHERE id IN (";
        for (var i in usersIDs) {
            p.query += " '" + usersIDs[i] + "',";
        }
        p.query = p.query.substring(0, p.query.length - 1) + ");";
        return knex.raw(p.query);
    };

    var update = function (usersIDs, skills, values) {
        return _queryBase(usersIDs, skills, values, function (p) {
            p.query += " skills[" + (p.j + 1) + "].count = " + values[p.i].count + ",";
        });
    };

    var _crementBase = function (usersIDs, skills, values, operation) {
        return _queryBase(usersIDs, skills, values, function (p) {
            p.query += " skills[" + (p.j + 1) + "].count = skills[" + (p.j + 1) + "].count " + operation + " " + (values[p.i].count || 1)+ ",";
        });
    };

    var increment = function (usersIDs, skills, values) {
        return _crementBase(usersIDs, skills, values, "+");
    };

    var decrement = function (usersIDs, skills, values) {
        return _crementBase(usersIDs, skills, values, "-");
    };

    return {
        parse: parse,
        update: update,
        increment: increment,
        decrement: decrement
    };
};