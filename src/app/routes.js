angular.module('app')
.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/projects');
  $stateProvider
    .state('projectList', {
      url         : '/projects',
      controller  : 'ProjectsCtrl',
      templateUrl : 'projects/projects.html'
    })
    .state('projectDetail', {
      url         : '/projects/:id',
      controller  : 'ProjectCtrl',
      templateUrl : 'projects/project.html'
    })
})
