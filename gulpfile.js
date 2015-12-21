var gulp    = require('gulp');
var uglify  = require('gulp-uglify');
var umd     = require('gulp-wrap-umd');
var rename  = require('gulp-rename');
var browser = require('browser-sync').create();


gulp.task( 'dist', function() {
  gulp.src('scrollreveal.js')
    .pipe( umd({ namespace: 'ScrollReveal', exports: 'ScrollReveal' }) )
    .pipe( gulp.dest('dist') )
});

gulp.task( 'dev', function() {
  gulp.src('scrollreveal.js')
    .pipe( gulp.dest('dev') );
});

gulp.task( 'dist:minify', function() {
  gulp.src('scrollreveal.js')
    .pipe( umd({ namespace: 'ScrollReveal', exports: 'ScrollReveal' }) )
    .pipe( uglify() )
    .pipe( rename('scrollreveal.min.js') )
    .pipe( gulp.dest('dist') )
})

gulp.task( 'default', function() {
  browser.init({ server: { baseDir: "./dev" } });
  gulp.watch([ 'scrollreveal.js '], [ 'dev' ])
  gulp.watch([ 'dev/*.*' ]).on( "change", browser.reload );
});

gulp.task( 'build', [ 'dist', 'dist:minify' ]);
