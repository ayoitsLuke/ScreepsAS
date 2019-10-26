module.exports = function(grunt) {
  require("time-grunt")(grunt);

  // Pull defaults (including username and password) from .screeps.json
  var config = require("./.screeps.json")

  // Allow grunt options to override default configuration
  var accountAlias = grunt.option("accountAlias") || config.accountAlias;
  var branch = grunt.option("branch") || config.branch;
  var email = grunt.option("email") || config.email;
  var password = grunt.option("password") || config.password;
  var private_directory = grunt.option("private_directory") || config.private_directory;
  var ptr = grunt.option("ptr") ? true : config.ptr;
  var token = grunt.option("token") || config.token;


  var currentdate = new Date();
  grunt.log.subhead("Task Start: " + currentdate.toLocaleString())
  grunt.log.writeln("Branch: " + branch)

  // Load needed tasks
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-uglify-es");
  grunt.loadNpmTasks("grunt-file-append");
  grunt.loadNpmTasks("grunt-rsync");
  grunt.loadNpmTasks("grunt-screeps-new");

  grunt.initConfig({

    // Push all files in the dist folder to screeps. What is in the dist folder
    // and gets sent will depend on the tasks used.
    screeps: {
      options: {
        // 通过accountAlias设置账户昵称
        accountAlias: accountAlias,
        // 注意：Token登陆为可选项，有Token的情况下优先使用Token登陆
        // Token 登陆只能用于官服，无法应用于私服
        token: token,
        email: email,
        password: password,
        branch: branch,
        ptr: ptr
      },
      dist: {
        src: ["dist/*.{js,wasm}"]
      }
    },


    'ts': {
      default: {
        options: {
          sourceMap: false,
          // 编译到的目标版本
          target: 'es6',
          rootDir: "srcts/**/*.ts"
        },
        // 要进行编译的目录及文件
        src: ["src/*.ts"],
        // 编译好的文件的输出目录
        outDir: 'dist/'
      }
    },


    // Copy all source files into the dist folder, flattening the folder
    // structure by converting path delimiters to underscores
    copy: {
      // Pushes the game code to the dist folder so it can be modified before
      // being send to the screeps server.
      screeps: {
        files: [{
          expand: true,
          cwd: "src/",
          src: "**",
          dest: "dist/",
          filter: "isFile",
          rename: (dest, src) => dest + src.replace(/\//g, "_"),
        }],
      }
    },


    // Copy files to the folder the client uses to sink to the private server.
    // Use rsync so the client only uploads the changed files.
    rsync: {
      options: {
        args: ["--verbose", "--checksum"],
        exclude: [".git*"],
        recursive: true
      },
      private: {
        options: {
          src: "./dist/",
          dest: private_directory,
        }
      },
    },


    // Add version variable using current timestamp.
    file_append: {
      versioning: {
        files: [{
          append: "global.SCRIPT_VERSION = " + currentdate.getTime() + "\n",
          input: "dist/version.js",
        }]
      }
    },


    // Remove all files from the dist folder.
    clean: ["dist/**"],


    // Documentation
    jsdoc: {
      dist: {
        cwd: "src",
        src: ["**/*.js"],
        expand: true,
        options: {
          destination: 'doc'
        }
      }
    },


    // Compress code
    uglify: {
      compress: {
        // Grunt will search for "**/*.js" under "stc/" when the "uglify" task
        // runs and build the appropriate src-dest file mappings then, so you
        // don't need to update the Gruntfile when files are added or removed.
        files: [{
          expand: true, // Enable dynamic expansion.
          cwd: 'src/', // Src matches are relative to this path.
          src: ['**', "!lib(trackable)/**/*"], // Actual pattern(s) to match.
          dest: 'dist/', // Destination path prefix.
          filter: "isFile",
          ext: '.js', // Dest filepaths will have this extension.
          extDot: 'first', // Extensions in filenames begin after the first dot
          rename: (dest, src) => dest + src.replace(/\//g, "_"),

        }, ],
      },
    },


  });
  // Combine the above into a default task
  grunt.registerTask("default", ["clean", "copy:screeps", "file_append:versioning", "screeps"]);
  grunt.registerTask("drill", ["clean", "copy:screeps", "file_append:versioning,"]);
  grunt.registerTask("private", ["clean", "copy:screeps", "file_append:versioning", "rsync:private"]);
  grunt.registerTask("ugly", ["clean", "uglify:compress", "file_append:versioning", "screeps"]);
  grunt.registerTask("doc", ["jsdoc"])
}
