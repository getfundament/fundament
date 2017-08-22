const gulp       = require('gulp'),
      plumber    = require('gulp-plumber'),
      watch      = require('gulp-watch'),
      concat     = require('gulp-concat'),
      rename     = require('gulp-rename'),
      uglify     = require('gulp-uglify'),
      prefixer   = require('gulp-autoprefixer'),
      sourcemaps = require('gulp-sourcemaps'),
      sass       = require('gulp-sass'),
      cssnano    = require('gulp-cssnano'),
      filter     = require('gulp-filter'),
      tsify      = require("tsify"),
      browserify = require("browserify"),
      source     = require('vinyl-source-stream'),
      buffer     = require('vinyl-buffer');

/**
 * Fundament source and dist paths.
 */
const Fundament = {
    js: {
        src: [
            'src/js/core.ts',
            'src/js/dialog.ts'
        ],
        watch: 'src/js/*.ts',
        dist: 'dist/js'
    },
    sass: {
        src: 'src/scss/build.scss',
        watch: 'src/scss/**/*.scss',
        dist: 'dist/css'
    }
};

/**
 * Gulp tasks.
 */
const tasks = {

    js: function() {
        return browserify({
                basedir: '.',
                debug: true,
                entries: [Fundament.js.src]
            })
            .plugin(tsify, {
                'target': 'es2015'
            })
            .transform('babelify', {
                presets: ['es2015'],
                extensions: ['.ts']
            })
            .bundle()
            .pipe(source('fundament.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.js.dist)) // compressed
            .pipe(filter('**/*.js'))
            .pipe(rename({suffix: '.min'}))
            .pipe(uglify({preserveComments: 'license'}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.js.dist)); // minified
    },

    sass: function() {
        return gulp.src(Fundament.sass.src)
            .pipe(plumber())
            .pipe(sourcemaps.init())
            .pipe(sass())
            .pipe(prefixer())
            .pipe(concat('fundament.css'))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.sass.dist)) // compressed
            .pipe(filter('**/*.css'))
            .pipe(rename({suffix: '.min'}))
            .pipe(cssnano({zindex: false}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(Fundament.sass.dist)); // minified
    },

    watch: function() {
        gulp.watch(Fundament.js.src, ['js']);
        gulp.watch(Fundament.sass.watch, ['sass']);
    },

    default: ['js', 'sass']

};

for (let task in tasks) {
    gulp.task(task, tasks[task]);
}
