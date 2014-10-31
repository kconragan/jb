angular.module("app",["ui.router","angular-carousel","templatescache","ngTextTruncate","projects"]).run(function(){FastClick.attach(document.body)}),angular.module("projects",[]),angular.module("app").config(["$stateProvider","$urlRouterProvider",function(t,e){e.otherwise("/projects"),t.state("projectList",{url:"/projects",controller:"ProjectsCtrl",templateUrl:"projects/projects.html"}).state("projectDetail",{url:"/projects/:id",controller:"ProjectCtrl",templateUrl:"projects/project.html"})}]),angular.module("app").controller("ProjectsCtrl",["$scope","$http","$filter","dataService",function(t,e,r,o){o.getAlbums().then(function(e){t.projects=e,t.predicate="-modified"})}]).controller("ProjectCtrl",["$scope","$stateParams","dataService",function(t,e,r){console.log(e.id),r.getAlbumPhotos(e.id).then(function(e){t.currentArtwork=6,t.title=e.title,t.description=e.description,t.masthead=e.masthead,t.photos=e.photos}),t.updateLightbox=function(e){t.currentArtwork=e}}]),angular.module("app").directive("lightboxTrigger",["$timeout",function(t){"use strict";return{link:function(e,r,o){r.bind("click",function(){e.$apply(function(){e.currentArtwork=o.currentIndex,$(".lightbox").removeClass("is-hidden")}),t(function(){},200)})}}}]).directive("closeLightbox",[function(){"use strict";return{link:function(t,e){e.bind("click",function(){$(".lightbox").addClass("is-hidden"),t.$apply(function(){t.updateLightbox(0)})})}}}]).directive("ripple",[function(){"use strict";return{link:function(t,e){e.bind("click",function(t){console.log("trigger ripple");var e=$("<div/>"),r=$(this).offset(),o=t.pageX-r.left,i=t.pageY-r.top;e.addClass("ripple-effect");var n=$(".ripple-effect");n.css("height",$(this).height()),n.css("width",$(this).height()),e.css({top:i-n.height()/2,left:o-n.width()/2,background:$(this).data("ripple-color")}).appendTo($(this)),window.setTimeout(function(){e.remove()},2e3)})}}}]);var GOOGLEID="112223276805962705555";angular.module("projects",[]).factory("dataService",["$http","$q",function(t,e){var r="https://picasaweb.google.com/data/feed/api/user/"+GOOGLEID+"/?alt=json";return{getAlbums:function(){var o=e.defer(),i=[];return t.get(r).success(function(e){var r=e.feed.entry;_.sortBy(r,function(t){var e=new Date(t.updated.$t);return console.log(e.getTime()),e.getTime()}).reverse(),_.each(r,function(e){var r={};r.id=e.gphoto$id.$t,r.title=e.title.$t,r.modified=e.updated.$t,r.thumbUrl=e.link[0].href,"Profile Photos"!==r.title&&t.get(r.thumbUrl).success(function(t){r.thumb=t.feed.entry[0].content.src,i.push(r)}).error(function(t){console.log(t)})}),o.resolve(i)}).error(function(){o.reject}),o.promise},getAlbumThumb:function(){},getAlbumPhotos:function(r){var o={},i="https://picasaweb.google.com/data/feed/api/user/"+GOOGLEID+"/albumid/"+r+"?alt=json&?imgmax=912",n=e.defer();return t.get(i).success(function(t){console.log(t),o.title=t.feed.title.$t,o.masthead=t.feed.entry[0].content.src;for(var e=[],r=0;r<t.feed.entry.length;r++){var i=t.feed.entry[r];""!==i.summary.$t&&""!==o.description&&(o.description=i.summary.$t);var c=i.content.src.split("/"),s=c[0]+"//"+c[2]+"/"+c[3]+"/"+c[4]+"/"+c[5]+"/"+c[6]+"/w400-h400-c/"+c[7],l=c[0]+"//"+c[2]+"/"+c[3]+"/"+c[4]+"/"+c[5]+"/"+c[6]+"/s1280/"+c[7];i.url=s,i.bigUrl=l,e.push(i)}o.photos=e,n.resolve(o)}).error(function(){n.reject}),n.promise}}}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsInByb2plY3RzL21vZHVsZS5qcyIsInJvdXRlcy5qcyIsInByb2plY3RzL3Byb2plY3RzLmNvbnRyb2xsZXIuanMiLCJwcm9qZWN0cy9wcm9qZWN0cy5kaXJlY3RpdmVzLmpzIiwicHJvamVjdHMvcHJvamVjdHMuc2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxRQUFBLE9BQUEsT0FDQSxZQUVBLG1CQUNBLGlCQUNBLGlCQUNBLGFBRUEsSUFBQSxXQUNBLFVBQUEsT0FBQSxTQUFBLFFDVEEsUUFBQSxPQUFBLGVDQUEsUUFBQSxPQUFBLE9BQ0EsUUFBQSxpQkFBQSxxQkFBQSxTQUFBLEVBQUEsR0FDQSxFQUFBLFVBQUEsYUFDQSxFQUNBLE1BQUEsZUFDQSxJQUFBLFlBQ0EsV0FBQSxlQUNBLFlBQUEsMkJBRUEsTUFBQSxpQkFDQSxJQUFBLGdCQUNBLFdBQUEsY0FDQSxZQUFBLDZCQ1hBLFFBQUEsT0FBQSxPQUNBLFdBQUEsZ0JBQUEsU0FBQSxRQUFBLFVBQUEsY0FBQSxTQUFBLEVBQUEsRUFBQSxFQUFBLEdBQ0EsRUFBQSxZQUFBLEtBQUEsU0FBQSxHQUNBLEVBQUEsU0FBQSxFQUNBLEVBQUEsVUFBQSxpQkFHQSxXQUFBLGVBQUEsU0FBQSxlQUFBLGNBQUEsU0FBQSxFQUFBLEVBQUEsR0FDQSxRQUFBLElBQUEsRUFBQSxJQUVBLEVBQUEsZUFBQSxFQUFBLElBQUEsS0FBQSxTQUFBLEdBQ0EsRUFBQSxlQUFBLEVBQ0EsRUFBQSxNQUFBLEVBQUEsTUFDQSxFQUFBLFlBQUEsRUFBQSxZQUNBLEVBQUEsU0FBQSxFQUFBLFNBQ0EsRUFBQSxPQUFBLEVBQUEsU0FHQSxFQUFBLGVBQUEsU0FBQSxHQUNBLEVBQUEsZUFBQSxNQ3BCQSxRQUFBLE9BQUEsT0FDQSxVQUFBLG1CQUFBLFdBQUEsU0FBQSxHQUNBLFlBQ0EsUUFDQSxLQUFBLFNBQUEsRUFBQSxFQUFBLEdBQ0EsRUFBQSxLQUFBLFFBQUEsV0FDQSxFQUFBLE9BQUEsV0FFQSxFQUFBLGVBQUEsRUFBQSxhQUNBLEVBQUEsYUFBQSxZQUFBLGVBRUEsRUFBQSxhQUNBLFlBS0EsVUFBQSxpQkFBQSxXQUNBLFlBQ0EsUUFDQSxLQUFBLFNBQUEsRUFBQSxHQUNBLEVBQUEsS0FBQSxRQUFBLFdBQ0EsRUFBQSxhQUFBLFNBQUEsYUFDQSxFQUFBLE9BQUEsV0FDQSxFQUFBLGVBQUEsWUFNQSxVQUFBLFVBQUEsV0FDQSxZQUNBLFFBQ0EsS0FBQSxTQUFBLEVBQUEsR0FFQSxFQUFBLEtBQUEsUUFBQSxTQUFBLEdBRUEsUUFBQSxJQUFBLGlCQUVBLElBQUEsR0FBQSxFQUFBLFVBQ0EsRUFBQSxFQUFBLE1BQUEsU0FDQSxFQUFBLEVBQUEsTUFBQSxFQUFBLEtBQ0EsRUFBQSxFQUFBLE1BQUEsRUFBQSxHQUdBLEdBQUEsU0FBQSxnQkFDQSxJQUFBLEdBQUEsRUFBQSxpQkFFQSxHQUFBLElBQUEsU0FBQSxFQUFBLE1BQUEsVUFDQSxFQUFBLElBQUEsUUFBQSxFQUFBLE1BQUEsVUFDQSxFQUFBLEtBQ0EsSUFBQSxFQUFBLEVBQUEsU0FBQSxFQUNBLEtBQUEsRUFBQSxFQUFBLFFBQUEsRUFDQSxXQUFBLEVBQUEsTUFBQSxLQUFBLGtCQUVBLFNBQUEsRUFBQSxPQUVBLE9BQUEsV0FBQSxXQUNBLEVBQUEsVUFDQSxXQ3pEQSxJQUFBLFVBQUEsdUJBRUEsU0FBQSxPQUFBLGVBQ0EsUUFBQSxlQUFBLFFBQUEsS0FBQSxTQUFBLEVBQUEsR0FFQSxHQUFBLEdBQUEsbURBQUEsU0FBQSxZQUVBLFFBRUEsVUFBQSxXQUNBLEdBQUEsR0FBQSxFQUFBLFFBQ0EsSUFrQ0EsT0FqQ0EsR0FBQSxJQUFBLEdBQUEsUUFBQSxTQUFBLEdBQ0EsR0FBQSxHQUFBLEVBQUEsS0FBQSxLQUNBLEdBQUEsT0FBQSxFQUFBLFNBQUEsR0FDQSxHQUFBLEdBQUEsR0FBQSxNQUFBLEVBQUEsUUFBQSxHQUVBLE9BREEsU0FBQSxJQUFBLEVBQUEsV0FDQSxFQUFBLFlBQ0EsVUFDQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEdBQ0EsR0FBQSxLQUVBLEdBQUEsR0FBQSxFQUFBLFVBQUEsR0FDQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEdBQ0EsRUFBQSxTQUFBLEVBQUEsUUFBQSxHQUNBLEVBQUEsU0FBQSxFQUFBLEtBQUEsR0FBQSxLQUdBLG1CQUFBLEVBQUEsT0FJQSxFQUFBLElBQUEsRUFBQSxVQUFBLFFBQUEsU0FBQSxHQUNBLEVBQUEsTUFBQSxFQUFBLEtBQUEsTUFBQSxHQUFBLFFBQUEsSUFDQSxFQUFBLEtBQUEsS0FFQSxNQUFBLFNBQUEsR0FDQSxRQUFBLElBQUEsT0FHQSxFQUFBLFFBQUEsS0FFQSxNQUFBLFdBQ0EsRUFBQSxTQUVBLEVBQUEsU0FHQSxjQUFBLGFBR0EsZUFBQSxTQUFBLEdBRUEsR0FBQSxNQUVBLEVBQUEsbURBQUEsU0FBQSxZQUFBLEVBQUEsd0JBQ0EsRUFBQSxFQUFBLE9Bb0NBLE9BbkNBLEdBQUEsSUFBQSxHQUFBLFFBQUEsU0FBQSxHQUNBLFFBQUEsSUFBQSxHQUNBLEVBQUEsTUFBQSxFQUFBLEtBQUEsTUFBQSxHQUNBLEVBQUEsU0FBQSxFQUFBLEtBQUEsTUFBQSxHQUFBLFFBQUEsR0FFQSxLQUFBLEdBREEsTUFDQSxFQUFBLEVBQUEsRUFBQSxFQUFBLEtBQUEsTUFBQSxPQUFBLElBQUEsQ0FFQSxHQUFBLEdBQUEsRUFBQSxLQUFBLE1BQUEsRUFNQSxNQUFBLEVBQUEsUUFBQSxJQUFBLEtBQUEsRUFBQSxjQUNBLEVBQUEsWUFBQSxFQUFBLFFBQUEsR0FHQSxJQUFBLEdBQUEsRUFBQSxRQUFBLElBQUEsTUFBQSxLQUVBLEVBQUEsRUFBQSxHQUFBLEtBQUEsRUFBQSxHQUFBLElBQUEsRUFBQSxHQUFBLElBQUEsRUFBQSxHQUFBLElBQUEsRUFBQSxHQUFBLElBQUEsRUFBQSxHQUFBLGdCQUFBLEVBQUEsR0FDQSxFQUFBLEVBQUEsR0FBQSxLQUFBLEVBQUEsR0FBQSxJQUFBLEVBQUEsR0FBQSxJQUFBLEVBQUEsR0FBQSxJQUFBLEVBQUEsR0FBQSxJQUFBLEVBQUEsR0FBQSxVQUFBLEVBQUEsRUFDQSxHQUFBLElBQUEsRUFDQSxFQUFBLE9BQUEsRUFFQSxFQUFBLEtBQUEsR0FHQSxFQUFBLE9BQUEsRUFFQSxFQUFBLFFBQUEsS0FHQSxNQUFBLFdBQ0EsRUFBQSxTQUVBLEVBQUEiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2FwcCcsIFtcbiAgJ3VpLnJvdXRlcicsXG4gIC8vICduZ0FuaW1hdGUnLFxuICAnYW5ndWxhci1jYXJvdXNlbCcsXG4gICd0ZW1wbGF0ZXNjYWNoZScsXG4gICduZ1RleHRUcnVuY2F0ZScsXG4gICdwcm9qZWN0cydcbl0pXG4ucnVuKGZ1bmN0aW9uKCkge1xuICBGYXN0Q2xpY2suYXR0YWNoKGRvY3VtZW50LmJvZHkpO1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgncHJvamVjdHMnLCBbXSlcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9wcm9qZWN0cycpO1xuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgncHJvamVjdExpc3QnLCB7XG4gICAgICB1cmwgICAgICAgICA6ICcvcHJvamVjdHMnLFxuICAgICAgY29udHJvbGxlciAgOiAnUHJvamVjdHNDdHJsJyxcbiAgICAgIHRlbXBsYXRlVXJsIDogJ3Byb2plY3RzL3Byb2plY3RzLmh0bWwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3Byb2plY3REZXRhaWwnLCB7XG4gICAgICB1cmwgICAgICAgICA6ICcvcHJvamVjdHMvOmlkJyxcbiAgICAgIGNvbnRyb2xsZXIgIDogJ1Byb2plY3RDdHJsJyxcbiAgICAgIHRlbXBsYXRlVXJsIDogJ3Byb2plY3RzL3Byb2plY3QuaHRtbCdcbiAgICB9KVxufSlcbiIsIid1c2Ugc3RyaWN0J1xuYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gIC5jb250cm9sbGVyKCdQcm9qZWN0c0N0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkaHR0cCwgJGZpbHRlciwgZGF0YVNlcnZpY2UpIHtcbiAgICBkYXRhU2VydmljZS5nZXRBbGJ1bXMoKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAkc2NvcGUucHJvamVjdHMgICAgICAgPSBkYXRhO1xuICAgICAgJHNjb3BlLnByZWRpY2F0ZSAgICAgID0gJy1tb2RpZmllZCc7XG4gICAgfSk7XG4gIH0pXG4gIC5jb250cm9sbGVyKCdQcm9qZWN0Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBkYXRhU2VydmljZSkge1xuICAgIGNvbnNvbGUubG9nKCRzdGF0ZVBhcmFtcy5pZCk7XG5cbiAgICBkYXRhU2VydmljZS5nZXRBbGJ1bVBob3Rvcygkc3RhdGVQYXJhbXMuaWQpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgJHNjb3BlLmN1cnJlbnRBcnR3b3JrID0gNjtcbiAgICAgICRzY29wZS50aXRsZSAgICAgICAgICA9IGRhdGEudGl0bGU7XG4gICAgICAkc2NvcGUuZGVzY3JpcHRpb24gICAgPSBkYXRhLmRlc2NyaXB0aW9uO1xuICAgICAgJHNjb3BlLm1hc3RoZWFkICAgICAgID0gZGF0YS5tYXN0aGVhZDtcbiAgICAgICRzY29wZS5waG90b3MgICAgICAgICA9IGRhdGEucGhvdG9zO1xuICAgIH0pO1xuICAgIFxuICAgICRzY29wZS51cGRhdGVMaWdodGJveCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAkc2NvcGUuY3VycmVudEFydHdvcmsgPSBpbmRleDtcbiAgICB9XG59KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gIC5kaXJlY3RpdmUoJ2xpZ2h0Ym94VHJpZ2dlcicsIFsnJHRpbWVvdXQnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gc2NvcGUudXBkYXRlTGlnaHRib3goYXR0cnMuY3VycmVudEluZGV4KTtcbiAgICAgICAgICAgIHNjb3BlLmN1cnJlbnRBcnR3b3JrID0gYXR0cnMuY3VycmVudEluZGV4O1xuICAgICAgICAgICAgJCgnLmxpZ2h0Ym94JykucmVtb3ZlQ2xhc3MoJ2lzLWhpZGRlbicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSlcbiAgLmRpcmVjdGl2ZSgnY2xvc2VMaWdodGJveCcsIFtmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHJldHVybiB7XG4gICAgICBsaW5rIDogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkKCcubGlnaHRib3gnKS5hZGRDbGFzcygnaXMtaGlkZGVuJyk7XG4gICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNjb3BlLnVwZGF0ZUxpZ2h0Ym94KDApO1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1dKVxuICAuZGlyZWN0aXZlKCdyaXBwbGUnLCBbZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICByZXR1cm4ge1xuICAgICAgbGluayA6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBcbiAgICAgICAgZWxlbWVudC5iaW5kKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnNvbGUubG9nKCd0cmlnZ2VyIHJpcHBsZScpO1xuICAgICAgICAgIFxuICAgICAgICAgIHZhciAkZGl2ICAgICAgPSAkKCc8ZGl2Lz4nKSxcbiAgICAgICAgICAgICAgYnRuT2Zmc2V0ID0gJCh0aGlzKS5vZmZzZXQoKSxcbiAgICAgICAgICAgICAgeFBvcyAgICAgID0gZXZlbnQucGFnZVggLSBidG5PZmZzZXQubGVmdCxcbiAgICAgICAgICAgICAgeVBvcyAgICAgID0gZXZlbnQucGFnZVkgLSBidG5PZmZzZXQudG9wO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICBcbiAgICAgICAgICAgICRkaXYuYWRkQ2xhc3MoJ3JpcHBsZS1lZmZlY3QnKTtcbiAgICAgICAgICAgIHZhciAkcmlwcGxlID0gJChcIi5yaXBwbGUtZWZmZWN0XCIpO1xuICAgICAgICAgIFxuICAgICAgICAgICAgJHJpcHBsZS5jc3MoXCJoZWlnaHRcIiwgJCh0aGlzKS5oZWlnaHQoKSk7XG4gICAgICAgICAgICAkcmlwcGxlLmNzcyhcIndpZHRoXCIsICQodGhpcykuaGVpZ2h0KCkpO1xuICAgICAgICAgICAgJGRpdi5jc3Moe1xuICAgICAgICAgICAgICB0b3A6IHlQb3MgLSAoJHJpcHBsZS5oZWlnaHQoKS8yKSxcbiAgICAgICAgICAgICAgbGVmdDogeFBvcyAtICgkcmlwcGxlLndpZHRoKCkvMiksXG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6ICQodGhpcykuZGF0YShcInJpcHBsZS1jb2xvclwiKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hcHBlbmRUbygkKHRoaXMpKTtcbiAgICAgICAgICBcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRkaXYucmVtb3ZlKCk7XG4gICAgICAgICAgICB9LCAyMDAwKTtcblxuICAgICAgICB9KTtcblxuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR09PR0xFSUQgPSAnMTEyMjIzMjc2ODA1OTYyNzA1NTU1JztcblxuYW5ndWxhci5tb2R1bGUoJ3Byb2plY3RzJywgW10pXG4gIC5mYWN0b3J5KCdkYXRhU2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkcSkge1xuXG4gICAgdmFyIGFsYnVtc1VSTCA9ICdodHRwczovL3BpY2FzYXdlYi5nb29nbGUuY29tL2RhdGEvZmVlZC9hcGkvdXNlci8nICsgR09PR0xFSUQgKyAnLz9hbHQ9anNvbic7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICBnZXRBbGJ1bXMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgdmFyIGFsYnVtcyA9IFtdO1xuICAgICAgICAkaHR0cC5nZXQoYWxidW1zVVJMKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICB2YXIgcHJvamVjdHMgPSBkYXRhLmZlZWQuZW50cnk7XG4gICAgICAgICAgXy5zb3J0QnkocHJvamVjdHMsIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUob2JqLnVwZGF0ZWQuJHQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZC5nZXRUaW1lKCkpO1xuICAgICAgICAgICAgcmV0dXJuIGQuZ2V0VGltZSgpO1xuICAgICAgICAgIH0pLnJldmVyc2UoKTtcbiAgICAgICAgICBfLmVhY2gocHJvamVjdHMsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBhbGJ1bSA9IHt9O1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YS5mZWVkLmVudHJ5W2ldKTtcbiAgICAgICAgICAgIGFsYnVtLmlkID0gZGF0YS5ncGhvdG8kaWQuJHQ7XG4gICAgICAgICAgICBhbGJ1bS50aXRsZSA9IGRhdGEudGl0bGUuJHQ7XG4gICAgICAgICAgICBhbGJ1bS5tb2RpZmllZCA9IGRhdGEudXBkYXRlZC4kdDtcbiAgICAgICAgICAgIGFsYnVtLnRodW1iVXJsID0gZGF0YS5saW5rWzBdLmhyZWY7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIERvbid0IHByb2Nlc3MgUHJvZmlsZSBQaG90b3MgYWxidW0sIHdoaWNoIGlzIGFsd2F5cyBwdWJsaWNcbiAgICAgICAgICAgIGlmKGFsYnVtLnRpdGxlID09PSAnUHJvZmlsZSBQaG90b3MnKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJGh0dHAuZ2V0KGFsYnVtLnRodW1iVXJsKS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIGFsYnVtLnRodW1iID0gcmVzcG9uc2UuZmVlZC5lbnRyeVswXS5jb250ZW50LnNyYztcbiAgICAgICAgICAgICAgYWxidW1zLnB1c2goYWxidW0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShhbGJ1bXMpO1xuICAgICAgICB9KVxuICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZGVmZXJyZWQucmVqZWN0O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuICAgICAgXG4gICAgICBnZXRBbGJ1bVRodW1iIDogZnVuY3Rpb24oaWQpIHtcbiAgICAgIH0sXG5cbiAgICAgIGdldEFsYnVtUGhvdG9zIDogZnVuY3Rpb24oaWQpIHtcblxuICAgICAgICB2YXIgcHJvamVjdCA9IHt9O1xuXG4gICAgICAgIHZhciBhbGJ1bVVSTCA9ICdodHRwczovL3BpY2FzYXdlYi5nb29nbGUuY29tL2RhdGEvZmVlZC9hcGkvdXNlci8nICsgR09PR0xFSUQgKyAnL2FsYnVtaWQvJyArIGlkICsgJz9hbHQ9anNvbiY/aW1nbWF4PTkxMic7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICRodHRwLmdldChhbGJ1bVVSTCkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgcHJvamVjdC50aXRsZSA9IGRhdGEuZmVlZC50aXRsZS4kdDtcbiAgICAgICAgICBwcm9qZWN0Lm1hc3RoZWFkID0gZGF0YS5mZWVkLmVudHJ5WzBdLmNvbnRlbnQuc3JjO1xuICAgICAgICAgIHZhciBwaG90b3MgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuZmVlZC5lbnRyeS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgaXRlbSA9IGRhdGEuZmVlZC5lbnRyeVtpXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gU2VlIGlmIGFuIGltYWdlIGhhcyBhIGNhcHRpb24uIElmIHNvLCB1c2UgYXMgYWxidW0gZGVjc2NyaXB0aW9uLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyBzdXBlciBoYWNreS4gSSBuZWVkIHRvIGZpbmQgYSB3YXkgdG8gYWxsb3cgYWxidW0tbGV2ZWxcbiAgICAgICAgICAgIC8vIGRlc2NyaXB0aW9ucyBidXQgaXQgZG9lc24ndCBjb21lIGJhY2sgaW4gdGhlIHBpY2Fzd2ViIGFwaS5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGl0ZW0uc3VtbWFyeS4kdCAhPT0gJycgJiYgcHJvamVjdC5kZXNjcmlwdGlvbiAhPT0gJycpIHtcbiAgICAgICAgICAgICAgcHJvamVjdC5kZXNjcmlwdGlvbiA9IGl0ZW0uc3VtbWFyeS4kdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHRlbXBVcmwgPSBpdGVtLmNvbnRlbnQuc3JjLnNwbGl0KCcvJyk7XG5cbiAgICAgICAgICAgIHZhciB1cmwgPSB0ZW1wVXJsWzBdICsgJy8vJyArIHRlbXBVcmxbMl0gKyAnLycgKyB0ZW1wVXJsWzNdICsgJy8nICsgdGVtcFVybFs0XSArICcvJyArIHRlbXBVcmxbNV0gKyAnLycgKyB0ZW1wVXJsWzZdICsgJy93NDAwLWg0MDAtYy8nICsgdGVtcFVybFs3XTtcbiAgICAgICAgICAgIHZhciBiaWdVcmwgPSB0ZW1wVXJsWzBdICsgJy8vJyArIHRlbXBVcmxbMl0gKyAnLycgKyB0ZW1wVXJsWzNdICsgJy8nICsgdGVtcFVybFs0XSArICcvJyArIHRlbXBVcmxbNV0gKyAnLycgKyB0ZW1wVXJsWzZdICsgJy9zMTI4MC8nICsgdGVtcFVybFs3XTtcbiAgICAgICAgICAgIGl0ZW0udXJsID0gdXJsO1xuICAgICAgICAgICAgaXRlbS5iaWdVcmwgPSBiaWdVcmw7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHBob3Rvcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHByb2plY3QucGhvdG9zID0gcGhvdG9zO1xuXG4gICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9qZWN0KTtcbiAgICAgICAgICAvLyByZXR1cm4gcmVzdWx0LmRhdGE7XG4gICAgICAgIH0pXG4gICAgICAgIC5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZWplY3Q7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==