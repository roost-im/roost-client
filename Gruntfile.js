// Generated on 2013-06-26 using generator-webapp 0.2.4
'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

var addHeaders = function(headers) {
    return function(req, res, next) {
        for (var key in headers) {
            res.setHeader(key, headers[key]);
        }
        next();
    };
}

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist'
    };

    var appConfig = {
        server: 'https://roost-api.mit.edu',
        serverPrincipal: 'HTTP/roost-api.mit.edu',
        webathena: 'https://webathena.mit.edu'
    };
    if (grunt.option('server'))
        appConfig.server = grunt.option('server');
    if (grunt.option('server-principal'))
        appConfig.serverPrincipal = grunt.option('server-principal');
    if (grunt.option('webathena'))
        appConfig.webathena = grunt.option('webathena');

    // Declare non-HSTS headers here, so they can be emitted both to
    // .htaccess and in the dev server.
    var websocketHost = appConfig.server.replace(/^http/, 'ws');
    var csp = "default-src 'self'; object-src 'none'; connect-src " +
        appConfig.server + ' ' + websocketHost;
    var headers = {
        // Standard header; Chrome 25+
        'Content-Security-Policy': csp,
        // Firefox and IE. Firefox uses a non-standard version of
        // connect-src (xhr-src).
        'X-Content-Security-Policy': csp +
            '; xhr-src ' + appConfig.server + ' ' + websocketHost,
        // Safari 6+ and Chrome < 25
        'X-WebKit-CSP': csp,
        // XSS filters can sometimes be abused to selectively disable
        // script tags. With inline script disabled, it's probably
        // fine, but it's configure them to hard-fail anyway.
        'X-XSS-Protection': '1; mode=block',
        // Disallow iframes to do a bit against click-jacking.
        'X-Frame-Options': 'deny',
        // Disable content sniffing, per Tangled Web. Though it's not
        // a huge deal as we're completely static.
        'X-Content-Options': 'nosniff'
    };

    grunt.initConfig({
        app: appConfig,
        yeoman: yeomanConfig,
        watch: {
            options: {
                nospawn: true
            },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    '<%= yeoman.app %>/*.html',
                    '{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
                    '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                            // livereload and CSP don't play well.
                            // lrSnippet,
                            addHeaders(headers),
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, yeomanConfig.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            },
            dist: {
                options: {
                    middleware: function (connect) {
                        return [
                            addHeaders(headers),
                            mountFolder(connect, yeomanConfig.dist)
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>'
            }
        },
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            server: [
               '.tmp',
               '<%= yeoman.app %>/scripts-src/config.js'
            ]
        },
/*
        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ['http://localhost:<%= connect.options.port %>/index.html']
                }
            }
        },
*/
        // not used since Uglify task does concat,
        // but still available if needed
        /*concat: {
            dist: {}
        },*/
        // not enabled since usemin task does concat and uglify
        // check index.html to edit your build targets
        // enable this task if you prefer defining your build targets here
        uglify: {
            options: { preserveComments: 'some' }
        },
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
                        '<%= yeoman.dist %>/styles/fonts/*'
                    ]
                }
            }
        },
        useminPrepare: {
            options: {
                dest: '<%= yeoman.dist %>'
            },
            html: '<%= yeoman.app %>/*.html'
        },
        usemin: {
            options: {
                dirs: ['<%= yeoman.dist %>']
            },
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css']
        },
        // Put files not handled in other tasks here
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        'images/{,*/}*.{webp,gif}',
                        'images/{,*/}*.{png,jpg,jpeg}',
                        'images/{,*/}*.svg',
                        'styles/{,*/}*.css',
			// Anything to be compiled goes in scripts-src/. This
			// directory is things that are already minified.
                        'scripts/{,*/}*.js',
                        '*.html'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: [
                        'generated/*'
                    ]
                }]
            }
        }
    });

    grunt.registerTask('config', function() {
        grunt.file.write(yeomanConfig.app + '/scripts-src/config.js',
                         'var CONFIG = ' + JSON.stringify(appConfig) + ';');

        var htaccess = grunt.file.read(yeomanConfig.app + '/.htaccess-header');
        htaccess += '\n';
        for (var key in headers) {
            htaccess += 'Header add ' + key + ' "' +
                headers[key].replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
            if (key == 'X-WebKit-CSP')
                htaccess += ' env=!broken_safari';
            htaccess += '\n';
        }
        grunt.file.write(yeomanConfig.app + '/.htaccess', htaccess);
    });

    grunt.registerTask('server', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'open', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'config',
            'connect:livereload',
            'open',
            'watch'
        ]);
    });

/*
    grunt.registerTask('test', [
        'clean:server',
        'connect:test',
        'mocha'
    ]);
*/

    grunt.registerTask('build', [
        'clean:dist',
        'config',
        'useminPrepare',
        'concat',
        'uglify',
        'copy:dist',
        'rev',
        'usemin'
    ]);

    grunt.registerTask('default', [
        //'test',
        'build'
    ]);
};
