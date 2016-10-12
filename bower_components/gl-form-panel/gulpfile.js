var gulp = require('gulp');
var htmlReplace = require('gulp-html-replace');

gulp.task('htmlReplace',function(){
     gulp.src('src/gl-form-panel.html')
    .pipe(htmlReplace({
        'import': {
                src:null,
                tpl: 
                '<link rel="import" href="../polymer/polymer.html">\n'
                +'<link rel="import" href="../paper-material/paper-material.html">\n'
                +'<link rel="import" href="../paper-card/paper-card.html">\n'
                +'<link rel="import" href="../paper-styles/paper-styles.html">'
        }
    }))
    .pipe(gulp.dest(''));
});


gulp.task('default', ['htmlReplace']);