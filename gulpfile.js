var gulp           = require('gulp'),
    sass           = require('gulp-sass'),
    minifycss      = require('gulp-minify-css'),
    uglify         = require('gulp-uglify'),
    rename         = require('gulp-rename'),
    concat         = require('gulp-concat'),
    notify         = require('gulp-notify'),
    del            = require('del'),
    useref         = require('gulp-useref'),
    gulpif         = require('gulp-if'),
    ngAnnotate     = require('gulp-ng-annotate'),
    htmlify        = require('gulp-angular-htmlify'),
    mainBowerFiles = require('main-bower-files'),
    gulpFilter     = require('gulp-filter'),
    webserver      = require('gulp-webserver'),
    sourcemaps     = require('gulp-sourcemaps'),
    templateCache  = require('gulp-angular-templatecache'),
    svgmin         = require('gulp-svgmin'),
    plumber        = require('gulp-plumber');

//paths object to save file paths for ease as gulpfile gets larger
var paths = {
  dev: {
    sass: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    bower: 'vendor'
  },
  build: {
    main: 'dist/',
    css: 'dist/css',
    js: 'dist/js'
  }
};

gulp.task('clean:all', function(cb) {
  del([
    'dist/mobile/**'
  ], cb);
});

gulp.task('clean:js', function(cb) {
  del([ 'dist/js/app.js' ], cb);
});

gulp.task('clean:css', function(cb) {
  del([ 'dist/css/styles.css' ], cb);
})

gulp.task('clean:templates', function(cb) {
  del([ 'dist/templates/*.js' ], cb);
});


gulp.task('clean:vendor', function(cb) {
  del([ 'dist/js/vendor.js' ], cb);
});

//error handler helper for jshint
function errorHandler (error) {
  this.emit('end');
}

gulp.task('webserver', function() {
  gulp.src('dist')
    .pipe(webserver({
      host: paths.host,
      port: paths.port,
      livereload: true,
      directoryListing: false,
      fallback : 'index.html'
  }))
});

//for now, only used in bower-files tasks
var jsFilter  = gulpFilter('*.js'),
    cssFilter = gulpFilter('*.css');

gulp.task('templates', [ 'clean:templates' ], function() {
  gulp.src('src/app/**/*.html')
    .pipe(templateCache('templatescache.js', {
      module:'templatescache',
      standalone:true
    }))
    .pipe(gulp.dest('dist/templates'));
})

//deal with getting bower dependencies into dist/index.html bower and minify and concat bower js into vendor.min.js
gulp.task('bower-files', [], function() {
  return gulp.src(mainBowerFiles())
    .pipe(jsFilter)
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest(paths.build.js));
});

gulp.task('bower-styles', [], function() {
  return gulp.src(mainBowerFiles())
    .pipe(cssFilter)
    .pipe(concat('vendor.min.css'))
    .pipe(gulp.dest(paths.build.css))
})

gulp.task('vendor', [ 'clean:vendor' ], function() {

  var src = [
    'vendor/fastclick/lib/fastclick.js',
    'vendor/angular-ui-router/release/angular-ui-router.min.js',
    'vendor/angular-carousel/dist/angular-carousel.js',
    'vendor/angular-touch/angular-touch.js',
    'vendor/ng-text-truncate/ng-text-truncate.js',
    'vendor/svg-injector/svg-injector.js'
  ]

  return gulp.src(src)
    .pipe(concat('vendor.js'))
    .pipe(ngAnnotate())
    .pipe(gulp.dest('dist/js'));

});

gulp.task('html', [], function() {
    var assets = useref.assets();
    return gulp.src('src/index.html')
      .pipe(assets)
      .pipe(htmlify())
      .pipe(assets.restore())
      .pipe(useref())
      .pipe(gulp.dest('dist'))
      .pipe(notify({ message: 'HTML task complete' }));
});

gulp.task('js', [ 'clean:js' ], function() {
  return gulp.src([ 'src/app/**/module.js', 'src/app/**/*.js' ])
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(concat('app.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'))
    .pipe(notify({ message: 'JS task complete' }));
});

// SASS task
gulp.task('sass', [ 'clean:css' ], function() {
  gulp.src('./src/styles/app.scss')
    .pipe(sass({
       style: 'compressed',
      bundleExec : false
    }))
    .pipe(concat('styles.css'))
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('svg', [], function () {
  return gulp.src('src/app/**/*.svg')
        .pipe(svgmin())
        .pipe(gulp.dest('dist/img'));
});

gulp.watch('src/**/*.js', [ 'js' ]);
gulp.watch('src/*.html', [ 'html' ]);
gulp.watch('src/app/**/*.html', [ 'templates' ]);
gulp.watch('src/**/*.scss', [ 'sass' ]);

gulp.task('default', [ 'clean:all', 'templates', 'js', 'html', 'sass', 'svg' ], function () {
  gulp.start('webserver');
});
