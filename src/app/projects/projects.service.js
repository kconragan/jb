'use strict';

var GOOGLEID = '112223276805962705555';

angular.module('projects', [])
  .factory('dataService', function($http, $q) {

    var albumsURL = 'https://picasaweb.google.com/data/feed/api/user/' + GOOGLEID + '/?alt=json';
    
    _createPiasaPhotoUrl= function(id, size) {
      var size = size || 's1280';
      var tempUrl = id.split('/');
      var url = tempUrl[0] + '//' + tempUrl[2] + '/' + tempUrl[3] + '/' + tempUrl[4] + '/' + tempUrl[5] + '/' + tempUrl[6] + '/s1280/' + tempUrl[7];
      console.log(url);
      return url
    }

    return {

      /*
       * getAlbums fetches all albums from Picasaweb for a given
       * user id and returns as a list
       */
      getAlbums : function() {
        
        // Create promise
        var deferred = $q.defer();
        var albums = [];
        
        // Send initial request
        $http.get(albumsURL).success(function(data) {
          var projects = data.feed.entry;
          
          // Currently sorting projects by last updated
          // This is a hack until we can figure out a more
          // deterministic way to establish sorting
          _.sortBy(projects, function (obj) {
            var d = new Date(obj.updated.$t);
            console.log(d.getTime());
            return d.getTime();
          }).reverse();
          
          // Organize each project
          _.each(projects, function(data) {
            
            var album = {};
            
            album.id       = data.gphoto$id.$t;
            album.title    = data.title.$t;
            album.modified = data.updated.$t;
            album.thumbUrl = data.link[0].href;
            
            // Don't process Profile Photos album, which is always public
            if(album.title === 'Profile Photos') {
              return;
            }
            
            // Fetch cover image for the album
            $http.get(album.thumbUrl).success(function(response) {
              // album.thumb = response.feed.entry[0].content.src;
              album.thumb = _createPiasaPhotoUrl(response.feed.entry[0].content.src);
              console.log('thumb url is ', album.thumb);
              albums.push(album);
            })
            .error(function(e) {
              console.log(e);
            });
          });
          deferred.resolve(albums);
        })
        .error(function() {
          deferred.reject;
        });
        return deferred.promise;
      },
      
      getAlbumThumb : function(id) {
      },

      getAlbumPhotos : function(id) {

        var project = {};

        var albumURL = 'https://picasaweb.google.com/data/feed/api/user/' + GOOGLEID + '/albumid/' + id + '?alt=json&?imgmax=912';
        var deferred = $q.defer();
        $http.get(albumURL).success(function(data) {
          console.log(data);
          project.title = data.feed.title.$t;
          project.masthead = _createPiasaPhotoUrl(data.feed.entry[0].content.src);
          var photos = [];
          for (var i = 0; i < data.feed.entry.length; i++) {
            
            var item = data.feed.entry[i];
            
            // See if an image has a caption. If so, use as album decscription.
            // This is super hacky. I need to find a way to allow album-level
            // descriptions but it doesn't come back in the picasweb api.
            
            if (item.summary.$t !== '' && project.description !== '') {
              project.description = item.summary.$t;
            }
            
            var tempUrl = item.content.src.split('/');

            var url = tempUrl[0] + '//' + tempUrl[2] + '/' + tempUrl[3] + '/' + tempUrl[4] + '/' + tempUrl[5] + '/' + tempUrl[6] + '/w1200-h1200-c/' + tempUrl[7];
            var bigUrl = tempUrl[0] + '//' + tempUrl[2] + '/' + tempUrl[3] + '/' + tempUrl[4] + '/' + tempUrl[5] + '/' + tempUrl[6] + '/s1640/' + tempUrl[7];
            item.url = url;
            item.bigUrl = bigUrl;
            
            photos.push(item);
          }

          project.photos = photos;

          deferred.resolve(project);
          // return result.data;
        })
        .error(function() {
          deferred.reject;
        });
        return deferred.promise;
      }
    };
  });
