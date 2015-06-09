
module.exports = function(skills) {
    skills = skills.replace(/{/g, '[');
    skills = skills.replace(/}/g, ']');
    skills = skills.replace(/"\(/g, '{"id": "');
    skills = skills.replace(/\)"/g, '}');
    skills = skills.replace(/},{/g, '} , {');
    skills = skills.replace(/(\S),/g, '$1", "count": ');
    return JSON.parse(skills);
};