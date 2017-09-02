var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');

var envOption = {
    string: 'env',
    default: { env: 'develop'}
};
var options = minimist(process.argv.slice(2), envOption);
console.log(options);


gulp.task('clean', function () {
    return gulp.src(['./.tmp', './public'], {read: false})
        .pipe($.clean());
});

gulp.task('copyHTML',function(){
    return gulp.src('./source/**/*.html')
        .pipe(gulp.dest('./public'));
});

gulp.task('jade', function() {
    gulp.src('./source/**/*.jade')
        .pipe($.plumber())  
        .pipe($.jade({
            pretty: true
        }))
        .pipe($.if(options.env === 'production', $.htmlmin({collapseWhitespace: true})))
        .pipe(gulp.dest('./public'))
        .pipe(browserSync.stream());
});

gulp.task('sass', function () {
    var plugins = [
        autoprefixer({browsers: ['last 3 version','>1%']})
    ];
    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())  
        .pipe($.sass().on('error', $.sass.logError))
        //css至此已編譯完成
        .pipe($.postcss(plugins))
        .pipe($.if(options.env === 'production', $.cleanCss()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream());
});

gulp.task('babel', () => 
    gulp.src('./source/js/**/*.js')
        .pipe($.plumber())    
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'production', $.uglify({
            compress: {
                drop_console: true
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())
);

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles({
        'overrides': {
            'vue': {
                'main': 'dist/vue.js'
            },
            'bootstrap': {
                'main': ['dist/css/bootstrap.css', 'dist/js/bootstrap.js']
            }
        }
    }))
        .pipe(gulp.dest('./.tmp/vendors'));
});

gulp.task('vendorJs', ['bower'], function(){
    return gulp.src('./.tmp/vendors/**/*.js')
        .pipe($.order([
            'jquery.js',
            'popper.js',
            'bootstrap.js'
        ]))
        .pipe($.concat('vendors.js'))
        .pipe($.if(options.env === 'production',$.uglify()))
        .pipe(gulp.dest('./public/js'));
});

gulp.task('vendorCss', ['bower'], function(){
    return gulp.src('./.tmp/vendors/**/*.css') 
        .pipe($.concat('vendors.css'))
        .pipe($.if(options.env === 'production', $.cleanCss()))
        .pipe(gulp.dest('./public/css'));   
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
});

gulp.task('image-min', () =>
    gulp.src('./source/images/*')
        .pipe($.if(options.env === 'production', $.imagemin()))
        .pipe(gulp.dest('./public/images'))
);

gulp.task('watch', function () {
    gulp.watch('./source/scss/**/*.scss', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/js/**/*.js', ['babel']);
});

gulp.task('build', $.sequence('clean', 'jade', 'sass', 'babel', 'vendorJs', 'vendorCss', 'image-min'));

gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'vendorCss', 'browser-sync', 'image-min', 'watch']);