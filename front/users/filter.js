angular.module('allProfilesFilters', []).filter('thousand', function () {
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
