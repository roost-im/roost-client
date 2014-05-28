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

After making sure everything works, send over everything in the _dist_ directory to wherever you plan to serve from. Scripts is likely the easiest choice. **Be sure to include the _.htaccess_ file when you move things over.** That file can often be forgotten and will result in undesired behavior when visiting the webpage.

**NOTE: Roost _must_ be deployed such that it is always connected to using HTTPS. Otherwise, attempting to log in with Webathena will fail. The current _.htaccess_ ensures this when possible.**

## Helpful Documentation
For those with no experience making web apps, you should start by learning the basics of Javascript/CSS/HTML before doing anything else.

For those with some experience using web apps, you should read and understand how to use the following libraries/languages/tools. Linked below are some resources to help you get started:

- Grunt (http://gruntjs.com/)
- Coffeescript (http://coffeescript.org/)
- SASS (http://sass-lang.com/)
- Handlebars (http://handlebarsjs.com/)
- Backbone (http://backbonejs.org/)

The most fundamental to the design is Backbone, which fortunately is so small in size that you could probably read and understand what it does within an hour. In fact, there is an annotated copy of the source linekd at the top of the Backbone webpage. It is highly encouraged that you have a good understanding of Backbone before editing the code, or that you look at the existing code to understand how it works.

Aside from these core tools, the code uses other helpful Javascript libraries, such as:
- jQuery - DOM manipulation
- underscore.js - utility functions
- moment.js - timekeeping
- mousetrap.js - hotkeys
- font-awesome - icons
- Basically anything else in the bower.json file

A basic understanding of these libraries is helpful when working with the code, especially to avoid doing more work than you have to. For example, underscore is going to provide a LOT of very helpful functions when working with collections or objects.

## Design
**This section is not about user experience design. This section is about code design.**

### Overview
The newest version of Roost recycles almost all of the Javasript from the old version, which is kept in _app/scripts-src/_. The recycled scripts provide numerous utility functions, but most importantly contains logic for communicating with the backend.

On top of this base, the new Roost is built using an MVC pattern with Backbone. At a high level, all data relevant to the client application is kept in Model objects. Views listen to events triggered when the Models change, and also have the ability to directly change Models. Similarly, Controllers connected to the backend listen to events triggered on the Models and also directly change the Models. This design makes it easy to swap out UI elements or backend connections without affecting other parts of the codebase.

For those interested in stepping through the code themselves, everything starts within the handler in _endpoint.coffee_.

### Models and the Client Session
On document load, the page creates a Session object that contains all the models necessary for that session. Each model is really just a dictionary or a collection of dictionaries. However, Backbone provides utilities for triggering and listening to events on models, which are used throughout the code. These models (and possibly the Session itself) are passed down directly to views and controllers when they are created.

Models should have relatively low complexity, since they are really just storing the data for the application. For example, a MessagePaneModel is just a dictionary of settings for a given pane and a list of MessageModels that serves as a caching layer for the application.

Currently, adding or removing a pane trickles through the session, so that controllers associated with the relevant pane can be created or deleted accordingly. I'm skepticaly as to whether or not this belongs in the session, and one may consider creating a PaneManager that handles this instead.

### Views
The views are structured as a standard tree, where parent views create child views and operate on them. Child views never operate or have knowledge of parent views. Views accept a set of models or the session object and bind event listeners accordingly.

Each view has an associated jQuery element object bound to it, created on initialization. This element is **not** in the DOM (yet). When rendered, a view fills in its $el with whatever contents it chooses. If the view is simple, it may just create a couple elements using jQuery and throw them in. If it's more complex, the view uses a Handlebars template, conveniently named the same name as the view class. After rendering, the element is **still not** in the DOM. Finally, the parent view must add the view's $el to its $el. (As you would expect, the top level view is added to $('body') in _endpoint.coffee_, to get things started.)

When models change, a view may choose to rerender itself entirely, or just change some component within it. Because rerendering is completely kosher, it is very important to **not reassign a view's $el**. This will desynchronize it with whatever is currently in the DOM and make all future renders fail.

In general, unless it is a parent-to-child relationship, views should not be poking other views. This would defeat the modularity of the view hierarchy design.

When it's time to destroy a view, be sure to destroy it properly. MessageView.remove is an overcooked example of how to prevent memory leaks (hopefully). Moreover, if a view creates many child views that could be destroyed during the course of the application, then that view is responsible for telling the child views to clean up. An example of this is in MessagePaneView, which maintains a list of all spawned MessageViews and destroys them accordingly. This is one of the minor pain points of Backbone; unlike other frameworks, you're left to do a lot of this messy stuff yourself.

### Controllers
Controllers extend neither Backbone.Model or Backbone.View, but upon construction extend themselves with the Backbone.Events object. This extension provides the listeTo() method required for listening to model events.

The controllers interface with the singleton API, TicketManager, and StorageManager objects located in the Session. These objects are part of the old Roost codebase and enable easy authentication/interfacing with the backend.

Similar to views, controllers listen to events on a model and respond accordingly. They also manipulate models, which in turn causes the views to update (if they choose to).

If a controller is a singleton that should exist for the entire client session, then it can be created in _endpoint.coffee_ upon initialization. The AuthenticationController and SubscriptionController are both created in this way, and after creation hang around listening to events.

In the case of the ComposeController and MessagePaneController, these controllers are paired with MessagePaneModels, which are created and destroyed freely. Because of this, these controllers are held in the Session, to be disposed of properly when the time comes.

As with views, controllers should only listen to and manipulate models - there should be no controller-to-controller contact or controller-to-view contact. In some cases, there is a unique defined interface between a controller and view across a model (MessagePaneView, MessagePaneModel, and MessagePaneController). Given the complexity of Roost, this uniqueness is somewhat inevitable.

### Future Inquiries
If you're interested in any other information regarding Roost, you can try contacting one of the people listed below:
- Backend, Backend API, Auth API, Webathena: davidben@davidben.net
- UI Design, Frontend Code: jfidi731@gmail.com
