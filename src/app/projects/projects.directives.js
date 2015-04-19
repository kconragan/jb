angular.module('app')
  .directive('lightboxTrigger', ['$timeout', function ($timeout) {
    'use strict';
    return {
      link: function (scope, element, attrs) {
        element.bind('click', function () {
          scope.$apply(function () {
            if(scope.currentArtwork !== attrs.currentIndex) {
              scope.updateLightbox(attrs.currentIndex);
            }
            // scope.currentArtwork = attrs.currentIndex;
            $('.lightbox').removeClass('is-hidden');
          });
          $timeout(function () {
          }, 200);
        });
      }
    };
  }])
  .directive('contactToggle', function() {
    'use strict';
    return {
      link: function(scope, element, attrs) {
        element.bind('click', function() {
          $('#app').addClass('is-hidden');
          $('#contact').addClass('is-visible');
        })
      }
    }
  })
  .directive('closeAbout', function() {
    'use strict';
    return {
      link: function(scope, element, attrs) {
        element.bind('click', function() {
          $('#app').removeClass('is-hidden');
          $('#contact').removeClass('is-visible');
        })
      }
    }
  })
  .directive('masthead', function ($timeout) {
    'use strict';
    return {
      scope : {
        bar : '=url'
      },
      link : function(scope, element, attributes) {
        /*
         *  Basically, we're looking to see when the main
         *  masthead image loads. Once it does, we fire off a
         *  series of animations.
         */
        var height = $(window).height() + 'px';
        
        scope.$watch('bar', function(value){
          if(value !== undefined) {
            $('<img/>').attr('src', value).load(function() {
              $(this).remove(); // prevent memory leaks
              // Animate container and image
              // .is-loaded sets of animations for text elements
              // that are children of .masthead
              // element.css({'height' : height});
              element.addClass('is-loaded');
              // Animate abstract if it exists
              $('.project-abstract').addClass('is-loaded');
              $timeout(function() {
                $('.masthead .more').addClass('bounce-slowly');
              }, 3500);
              // Animate image grid
            });
          }
        });
      }
    };
  })
  .directive('closeLightbox', [function () {
    'use strict';
    return {
      link : function (scope, element) {
        element.bind('click', function() {
          $('.lightbox').addClass('is-hidden');
          scope.$apply(function () {
            scope.updateLightbox(0);
          });
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
    };
  }])
  .directive("scroll", function ($window) {
    function getCurrentScroll() {
      return window.pageYOffset || document.documentElement.scrollTop;
    }
    return function(scope, element, attrs) {
      
      var previousScroll = 0;
      var scrollCounter  = 0;
      
      var $header = $('header.header');
      angular.element($window).bind("scroll", function() {
        var currentScroll = $(this).scrollTop();
        
        if(currentScroll > previousScroll) {
          if(currentScroll > 0) {
            if(!$header.hasClass('is-hidden')) {
              if(scrollCounter > 0) {
                $header.addClass('is-hidden');
                $header.removeClass('is-filled');
                scrollCounter = 0;
              }
            }
          }
        }
        else {
          console.log('scrolling up');
          scrollCounter++;
          if(scrollCounter > 2) {
            $header.removeClass('is-hidden');
            if($header.hasClass('transparent')) {
              if(currentScroll > $(window).height()) {
                $header.addClass('is-filled');
              }
              else {
                $header.removeClass('is-filled');
              }
            }
          }
        }
        previousScroll = getCurrentScroll();
      });
    };
});
