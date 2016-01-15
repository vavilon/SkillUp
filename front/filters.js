app.filter('objectByKeyValFilter', function () {
    return function (input, filterKey, filterVal) {
        var filteredInput = {};
        angular.forEach(input, function (value, key) {
            if (value[filterKey] && (new RegExp(filterVal, "i")).test(value[filterKey])) {
                filteredInput[key] = value;
            }
        });
        return filteredInput;
    }
});

app.filter('objectByKeyValFilterArr', function () {
    return function (input, filterKey, filterVal) {
        var filteredInput = [];
        angular.forEach(input, function (value, key) {
            if (value[filterKey] && (new RegExp(filterVal, "i")).test(value[filterKey])) {
                filteredInput.push(value);
            }
        });
        return filteredInput;
    }
});

app.filter('thousand', function () {
    return function (input) {
        input = "" + input;
        var num = input.split("");

        var arr = "";
        var count = 0;

        for (var i = num.length - 1; i > -1; i--) {
            arr = num[i] + "" + arr;
            count++;
            if (count == 3 && i != 0) {
                arr = "," + arr;
                count = 0;
            }
        }
        return arr;
    };
});

app.filter('gender', function () {
    return function (input) {
        return input == 'male' ? 'Мужской': 'Женский';
    };
});