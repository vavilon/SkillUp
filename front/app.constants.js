(function() {
    var buildRep = '/dist';

    var templates = {
        competences: {
            templateUrl: buildRep + '/competences/competences.html',
            controller: 'CompetencesController' },

        /* Directives templates */
        likeButton: { templateUrl: buildRep + '/components/buttons/like-button.directive.html' },
        receiveButton: { templateUrl: buildRep + '/components/buttons/receive-button.directive.html' },
        skillButton: { templateUrl: buildRep + '/components/buttons/skill-button.directive.html' },
        comments: { templateUrl: buildRep + '/components/widgets/comments.directive.html' },
        solutionsList: { templateUrl: buildRep + '/components/widgets/solutions-list.directive.html' },
        tasksList: { templateUrl: buildRep + '/components/widgets/tasks-list.directive.html' },

        loginDialog: {
            templateUrl: buildRep + '/layout/login-dialog.html',
            controller: 'LoginDialogController' },
        createTaskDialog: {
            templateUrl: buildRep + '/main/create-task-dialog.html',
            controller: 'CreateTaskDialogController' },
        main: {
            templateUrl: buildRep + '/main/main.html',
            controller: 'MainController' },
        addSkillDialog: {
            templateUrl: buildRep + '/skills/add-skill-dialog.html',
            controller: 'SkillsDialogController' },
        deleteSkillDialog: {
            templateUrl: buildRep + '/skills/delete-skill-dialog.html',
            controller: 'SkillsDialogController' },
        updateSkillDialog: {
            templateUrl: buildRep + '/skills/update-skill-dialog.html',
            controller: 'SkillsDialogController' },
        skills: {
            templateUrl: buildRep + '/skills/skills.html',
            controller: 'SkillsController' },
        allTasks: {
            templateUrl: buildRep + '/tasks/all-tasks.html',
            controller: 'AllTasksController' },
        oneTask: {
            templateUrl: buildRep + '/tasks/one-task.html',
            controller: 'OneTaskController' },
        admin: {
            templateUrl: buildRep + '/users/admin/admin.html',
            controller: 'AdminController' },
        propertyDialog: {
            templateUrl: buildRep + '/users/admin/property-dialog.html',
            controller: 'PropertyDialogController' },
        allUsers: {
            templateUrl: buildRep + '/users/all-users/all-users.html',
            controller: 'AllUsersController' },
        addUserInfoDialog: {
            templateUrl: buildRep + '/users/profile/add-user-info-dialog.html',
            controller: 'AddUserInfoDialogController' },
        profile: {
            templateUrl: buildRep + '/users/profile/profile.html',
            controller: 'ProfileController' },
        registration: {
            templateUrl: buildRep + '/users/registration/registration.html',
            controller: 'RegistrationController' },
        restorePassword: {
            templateUrl: buildRep + '/users/restore-password/restore-password.html',
            controller: 'RestorePasswordController' }
    };

    angular
        .module('skillup')
        .constant('templates', templates);
})();