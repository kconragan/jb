angular.module('app')
  .directive('lightboxTrigger', ['$timeout', function ($timeout) {
    'use strict';
    return {
      link: function (scope, element, attrs) {
        element.bind('click', function () {
          scope.$apply(function () {
            // scope.updateLightbox(attrs.currentIndex);
            scope.currentArtwork = attrs.currentIndex;
            $('.lightbox').removeClass('is-hidden');
          });
          $timeout(function () {
          }, 200);
        });
      }
    };
  }])
  .directive('closeLightbox', [function () {
    'use strict';
    return {
      link : function (scope, element) {
        element.bind('click', function() {
          $('.lightbox').addClass('is-hidden');
          scope.$apply(function () {
            scope.updateLightbox(0);
          })
        });
      }
    };
  }])
  .directive('ripple', [function () {
    'use strict';
    return {
      link : function(scope, element, attrs) {
        
        element.bind('click', function (event) {
          
          console.log('trigger ripple');
          
          var $div      = $('<div/>'),
              btnOffset = $(this).offset(),
              xPos      = event.pageX - btnOffset.left,
              yPos      = event.pageY - btnOffset.top;
              
          
            $div.addClass('ripple-effect');
            var $ripple = $(".ripple-effect");
          
            $ripple.css("height", $(this).height());
            $ripple.css("width", $(this).height());
            $div.css({
              top: yPos - ($ripple.height()/2),
              left: xPos - ($ripple.width()/2),
              background: $(this).data("ripple-color")
            })
            .appendTo($(this));
          
            window.setTimeout(function(){
              $div.remove();
            }, 2000);

        });

      }
    }
  }]);
