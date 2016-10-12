var gulp = require('gulp');
var replace = require('gulp-replace');

gulp.task('htmlReplace',function(){
     
     gulp.src('src/*')
    .pipe(replace('../bower_components/','../'))
    .pipe(gulp.dest(''));
     
    //  gulp.src('src/gl-form-label-textarea.html')
    // .pipe(replace('../bower_components/','../'))
    // .pipe(gulp.dest(''));

    //  gulp.src('src/gl-form-input.html')
    // .pipe(replace('../bower_components/','../'))
    // .pipe(gulp.dest(''));

    //  gulp.src('src/gl-form-textarea.html')
    // .pipe(replace('../bower_components/','../'))
    // .pipe(gulp.dest(''));

    //  gulp.src('src/gl-form-dropdown-menu.html')
    // .pipe(replace('../bower_components/','../'))
    // .pipe(gulp.dest(''));

    //  gulp.src('src/gl-form-panel.html')
    // .pipe(replace('../bower_components/','../'))
    // .pipe(gulp.dest(''));
    
});

gulp.task('watch',function(){
    gulp.watch('src/*',['htmlReplace']);
    // gulp.watch('src/gl-form-label-textarea.html',['htmlReplace']);
    // gulp.watch('src/gl-form-panel.html',['htmlReplace']);
    // gulp.watch('src/gl-form-input.html',['htmlReplace']);
    // gulp.watch('src/gl-form-textarea.html',['htmlReplace']);
    // gulp.watch('src/gl-form-dropdown-menu.html',['htmlReplace']);
});

gulp.task('default', ['htmlReplace','watch']);