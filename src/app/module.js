angular.module('app', [
  'ui.router',
  'ngAnimate',
  'angular-carousel',
  'templatescache',
  'ngTextTruncate',
  'projects'
])
.run(function() {
  FastClick.attach(document.body);
});
