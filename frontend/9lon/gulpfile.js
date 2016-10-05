var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('build',function(){
     gulp.src(['src/glon-system.html','src/gl-param.html','src/glon-behavior.html'])
    .pipe($.replace('../bower_components/','../../'))
    .pipe($.crisper({scriptInHead:false}))
    .pipe($.sourcemaps.init())
    .pipe($.if('*.js',$.babel({ presets: ['es2015'] })))
    .pipe($.if('*.js',$.uglify()))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('dist/'))

});

gulp.task('watch',function(){
    gulp.watch('src/plon-system.html',['build']);
});

gulp.task('default',['build']);