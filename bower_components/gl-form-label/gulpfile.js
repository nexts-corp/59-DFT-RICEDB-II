var gulp = require('gulp');
var htmlReplace = require('gulp-html-replace');

gulp.task('htmlReplace',function(){
     gulp.src('src/gl-form-label.html')
    .pipe(htmlReplace({
        'import': {
                src:null,
                tpl: 
                '<link rel="import" href="../polymer/polymer.html">\n'
                +'<link rel="import" href="../paper-input/paper-textarea.html">'
        }
    }))
    .pipe(gulp.dest(''));
});


gulp.task('default', ['htmlReplace']);