'use strict'
angular.module('app')
  .controller('ProjectsCtrl', function ($scope, $http, $filter, dataService) {
    dataService.getAlbums().then(function (data) {
      $scope.projects       = data;
      $scope.predicate      = '-modified';
    });
  })
  .controller('ProjectCtrl', function($scope, $stateParams, dataService) {
    console.log($stateParams.id);

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
