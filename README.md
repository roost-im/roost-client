# Roost
Roost is an experimental new web-based zephyr client with proper
authentication. This is the official web-based frontend. The backend lives in
the companion roost.git repository. If you only wish to hack on the frontend,
only this repository is needed. By default, it will point against the official
backend deployment.

This client is intended to support recent versions of modern browsers. Most notably, it does not intend to support IE8 and earlier. The site functions reasonably well on tablet in both orientations and mobile phones in portrait mode.

## Getting Started

To work on and build Roost, you'll need the following installed on your machine:
- node.js
- npm
- Ruby
- sass (`gem install sass` should handle this)

After cloning the repo, enter the top-level directory and run the following:
- `npm install -g bower grunt-cli` (install bower and grunt command line tools)
- `npm install` (install all node modules needed for Roost)
- `bower install` (download additional Javascript libraries)

## Editing Code
Since the new version of Roost uses Coffeescript, Handlebars, and SASS, you will need to compile the code before seeing the effects in a browser. The code is compiled using a tool called Grunt, which will report any syntax errors you may have when you run one of the following commands:
- `grunt sass`
- `grunt coffee`
- `grunt handlebars`

Alternatively, you can compile all three at once using the command `grunt sass coffee handlebars`.

Finally you can have Grunt continue to spin and watch any relevant file changes to compile with the command `grunt watch`. However, **I (jrafidi) have had problems in the past with `grunt watch` stopping after you make a syntax error.**

## Running the Development Server
When you're writing code for Roost, you can view the webpage at any time after running `grunt server`. Running that command will open the page at http://localhost:9000/ and also execute a spinning `grunt watch`.

As mentioned above, this server will point at the current backend deployment. If you'd like to point the server at a different backend, you can add arguments such as:

`grunt --server=http://localhost:8080 server`

## Deploying
Before deploying a new version of Roost, first check if your version builds properly with the command `grunt server:dist`. This command uglifies/minifies the code and shoves it into the _dist_ directory. Then, it serves up the page through that directory, allowing you to check if the built version functions properly.

Next, you can run any tests using the command `grunt test`.

After making sure everything works, send over everything in the _dist_ directory to wherever you plan to serve from. Scripts is likely the easiest choice. **Be sure to include the _.htaccess_ file when you move things over.**

