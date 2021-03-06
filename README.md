scbone
======

Simple soundcloud player/client based on backbone.js.


Aims and goals
--------------

This is a personal project, its aim is first to be included in my website [irata.ch](http://irata.ch) (who should be relaunched soon). It is therefor an expirmental project (but I try not to neglect quality).  
If somebody find it interesting and want to reuse it, be my guest.

Demonstration
-------------

As mentionned, I wrote that for my [personal page](http://irata.ch) or on the [project page](http://zeropaper.github.io/scbone/) - still have some issues with font of icons.

Use
---

In a _require.js_ you might use something like:
```js
require.config = ({
  // ...
  paths: {
    // ...
    scbone: 'app/components/scbone/scbone'
  }
});

require(['scbone'], function(SCBone) {
  var scBone = new SCBone({
    // you will need to pass a DOM node as `el` option
    el:             $('.scbone')[0],
    // you can set a default user profile
    hostpermalink:  'zeropaper'
  });
});
```

Development
-----------

Some developement tools are available using [grunt.js](http://gruntjs.com).  
To use them:

1. install `node` (if needed)
2. install `npm` (if needed)
3. install `grunt-cli`, `bower` , `testem` (if needed)   
   `npm install -g grunt-cli bower testem`
4. clone the repository and go in its directory
5. install the dependencies   
   `npm install` `bower install`
6. Start the developement task / server  
   `grunt dev`

Architecture
------------

The player is based on [backbone.js](http://backbone.org) and uses [require.js]().

Testing
-------

A few tests are already written (more are comming).
You can run them using the `testem` command from the project directory.

License
-------

This piece of code is licensed under the MIT license
(see [LICENSE](https://raw.github.com/zeropaper/scbone/master/LICENSE)).
