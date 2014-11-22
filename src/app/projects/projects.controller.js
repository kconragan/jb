'use strict'
angular.module('app')
  .controller('ViewController', function($scope) {
    $scope.layoutConfig = {
      fullBleed : 'fullbleed'
    }
  })
  .controller('ProjectsCtrl', function ($scope, $http, $filter, dataService) {
    $scope.layoutConfig.fullbleed = 'fullbleed';
    dataService.getAlbums().then(function (data) {
      $scope.projects       = data;
      $scope.predicate      = '-modified';
    });
  })
  .controller('ProjectCtrl', function($scope, $stateParams, dataService) {
    // console.log($stateParams.id);
    
    $scope.layoutConfig.fullbleed = '';
    
    $scope.$on('$stateChangeSuccess', function (event, toState) {
      // console.log(event, toState);
    });

    dataService.getAlbumPhotos($stateParams.id).then(function(data) {
      $scope.currentArtwork = 6;
      $scope.title          = data.title;
      $scope.description    = data.description;
      $scope.masthead       = data.masthead;
      $scope.photos         = data.photos;
    });
    
    $scope.updateLightbox = function(index) {
      $scope.currentArtwork = index;
    }
})
