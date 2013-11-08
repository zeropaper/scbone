/*! scbone - v0.0.1 - 2013-11-08 */
/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.1.9 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */
var requirejs, require, define;

(function(global) {
  var req, s, head, baseElement, dataMain, src, interactiveScript, currentlyAddingScript, mainScript, subPath, version = "2.1.9", commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm, cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g, jsSuffixRegExp = /\.js$/, currDirRegExp = /^\.\//, op = Object.prototype, ostring = op.toString, hasOwn = op.hasOwnProperty, ap = Array.prototype, apsp = ap.splice, isBrowser = !!(typeof window !== "undefined" && typeof navigator !== "undefined" && window.document), isWebWorker = !isBrowser && typeof importScripts !== "undefined", //PS3 indicates loaded and complete, but need to wait for complete
  //specifically. Sequence is 'loading', 'loaded', execution,
  // then 'complete'. The UA check is unfortunate, but not sure how
  //to feature test w/o causing perf issues.
  readyRegExp = isBrowser && navigator.platform === "PLAYSTATION 3" ? /^complete$/ : /^(complete|loaded)$/, defContextName = "_", //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
  isOpera = typeof opera !== "undefined" && opera.toString() === "[object Opera]", contexts = {}, cfg = {}, globalDefQueue = [], useInteractive = false;
  function isFunction(it) {
    return ostring.call(it) === "[object Function]";
  }
  function isArray(it) {
    return ostring.call(it) === "[object Array]";
  }
  /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
  function each(ary, func) {
    if (ary) {
      var i;
      for (i = 0; i < ary.length; i += 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }
  /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
  function eachReverse(ary, func) {
    if (ary) {
      var i;
      for (i = ary.length - 1; i > -1; i -= 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }
  function hasProp(obj, prop) {
    return hasOwn.call(obj, prop);
  }
  function getOwn(obj, prop) {
    return hasProp(obj, prop) && obj[prop];
  }
  /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
  function eachProp(obj, func) {
    var prop;
    for (prop in obj) {
      if (hasProp(obj, prop)) {
        if (func(obj[prop], prop)) {
          break;
        }
      }
    }
  }
  /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
  function mixin(target, source, force, deepStringMixin) {
    if (source) {
      eachProp(source, function(value, prop) {
        if (force || !hasProp(target, prop)) {
          if (deepStringMixin && typeof value !== "string") {
            if (!target[prop]) {
              target[prop] = {};
            }
            mixin(target[prop], value, force, deepStringMixin);
          } else {
            target[prop] = value;
          }
        }
      });
    }
    return target;
  }
  //Similar to Function.prototype.bind, but the 'this' object is specified
  //first, since it is easier to read/figure out what 'this' will be.
  function bind(obj, fn) {
    return function() {
      return fn.apply(obj, arguments);
    };
  }
  function scripts() {
    return document.getElementsByTagName("script");
  }
  function defaultOnError(err) {
    throw err;
  }
  //Allow getting a global that expressed in
  //dot notation, like 'a.b.c'.
  function getGlobal(value) {
    if (!value) {
      return value;
    }
    var g = global;
    each(value.split("."), function(part) {
      g = g[part];
    });
    return g;
  }
  /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
  function makeError(id, msg, err, requireModules) {
    var e = new Error(msg + "\nhttp://requirejs.org/docs/errors.html#" + id);
    e.requireType = id;
    e.requireModules = requireModules;
    if (err) {
      e.originalError = err;
    }
    return e;
  }
  if (typeof define !== "undefined") {
    //If a define is already in play via another AMD loader,
    //do not overwrite.
    return;
  }
  if (typeof requirejs !== "undefined") {
    if (isFunction(requirejs)) {
      //Do not overwrite and existing requirejs instance.
      return;
    }
    cfg = requirejs;
    requirejs = undefined;
  }
  //Allow for a require config object
  if (typeof require !== "undefined" && !isFunction(require)) {
    //assume it is a config object.
    cfg = require;
    require = undefined;
  }
  function newContext(contextName) {
    var inCheckLoaded, Module, context, handlers, checkLoadedTimeoutId, config = {
      //Defaults. Do not set a default for map
      //config to speed up normalize(), which
      //will run faster if there is no default.
      waitSeconds: 7,
      baseUrl: "./",
      paths: {},
      pkgs: {},
      shim: {},
      config: {}
    }, registry = {}, //registry of just enabled modules, to speed
    //cycle breaking code when lots of modules
    //are registered, but not activated.
    enabledRegistry = {}, undefEvents = {}, defQueue = [], defined = {}, urlFetched = {}, requireCounter = 1, unnormalizedCounter = 1;
    /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
    function trimDots(ary) {
      var i, part;
      for (i = 0; ary[i]; i += 1) {
        part = ary[i];
        if (part === ".") {
          ary.splice(i, 1);
          i -= 1;
        } else if (part === "..") {
          if (i === 1 && (ary[2] === ".." || ary[0] === "..")) {
            //End of the line. Keep at least one non-dot
            //path segment at the front so it can be mapped
            //correctly to disk. Otherwise, there is likely
            //no path mapping for a path starting with '..'.
            //This can still fail, but catches the most reasonable
            //uses of ..
            break;
          } else if (i > 0) {
            ary.splice(i - 1, 2);
            i -= 2;
          }
        }
      }
    }
    /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
    function normalize(name, baseName, applyMap) {
      var pkgName, pkgConfig, mapValue, nameParts, i, j, nameSegment, foundMap, foundI, foundStarMap, starI, baseParts = baseName && baseName.split("/"), normalizedBaseParts = baseParts, map = config.map, starMap = map && map["*"];
      //Adjust any relative paths.
      if (name && name.charAt(0) === ".") {
        //If have a base name, try to normalize against it,
        //otherwise, assume it is a top-level require that will
        //be relative to baseUrl in the end.
        if (baseName) {
          if (getOwn(config.pkgs, baseName)) {
            //If the baseName is a package name, then just treat it as one
            //name to concat the name with.
            normalizedBaseParts = baseParts = [ baseName ];
          } else {
            //Convert baseName to array, and lop off the last part,
            //so that . matches that 'directory' and not name of the baseName's
            //module. For instance, baseName of 'one/two/three', maps to
            //'one/two/three.js', but we want the directory, 'one/two' for
            //this normalization.
            normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
          }
          name = normalizedBaseParts.concat(name.split("/"));
          trimDots(name);
          //Some use of packages may use a . path to reference the
          //'main' module name, so normalize for that.
          pkgConfig = getOwn(config.pkgs, pkgName = name[0]);
          name = name.join("/");
          if (pkgConfig && name === pkgName + "/" + pkgConfig.main) {
            name = pkgName;
          }
        } else if (name.indexOf("./") === 0) {
          // No baseName, so this is ID is resolved relative
          // to baseUrl, pull off the leading dot.
          name = name.substring(2);
        }
      }
      //Apply map config if available.
      if (applyMap && map && (baseParts || starMap)) {
        nameParts = name.split("/");
        for (i = nameParts.length; i > 0; i -= 1) {
          nameSegment = nameParts.slice(0, i).join("/");
          if (baseParts) {
            //Find the longest baseName segment match in the config.
            //So, do joins on the biggest to smallest lengths of baseParts.
            for (j = baseParts.length; j > 0; j -= 1) {
              mapValue = getOwn(map, baseParts.slice(0, j).join("/"));
              //baseName segment has config, find if it has one for
              //this name.
              if (mapValue) {
                mapValue = getOwn(mapValue, nameSegment);
                if (mapValue) {
                  //Match, update name to the new value.
                  foundMap = mapValue;
                  foundI = i;
                  break;
                }
              }
            }
          }
          if (foundMap) {
            break;
          }
          //Check for a star map match, but just hold on to it,
          //if there is a shorter segment match later in a matching
          //config, then favor over this star map.
          if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
            foundStarMap = getOwn(starMap, nameSegment);
            starI = i;
          }
        }
        if (!foundMap && foundStarMap) {
          foundMap = foundStarMap;
          foundI = starI;
        }
        if (foundMap) {
          nameParts.splice(0, foundI, foundMap);
          name = nameParts.join("/");
        }
      }
      return name;
    }
    function removeScript(name) {
      if (isBrowser) {
        each(scripts(), function(scriptNode) {
          if (scriptNode.getAttribute("data-requiremodule") === name && scriptNode.getAttribute("data-requirecontext") === context.contextName) {
            scriptNode.parentNode.removeChild(scriptNode);
            return true;
          }
        });
      }
    }
    function hasPathFallback(id) {
      var pathConfig = getOwn(config.paths, id);
      if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
        //Pop off the first array value, since it failed, and
        //retry
        pathConfig.shift();
        context.require.undef(id);
        context.require([ id ]);
        return true;
      }
    }
    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
      var prefix, index = name ? name.indexOf("!") : -1;
      if (index > -1) {
        prefix = name.substring(0, index);
        name = name.substring(index + 1, name.length);
      }
      return [ prefix, name ];
    }
    /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
    function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
      var url, pluginModule, suffix, nameParts, prefix = null, parentName = parentModuleMap ? parentModuleMap.name : null, originalName = name, isDefine = true, normalizedName = "";
      //If no name, then it means it is a require call, generate an
      //internal name.
      if (!name) {
        isDefine = false;
        name = "_@r" + (requireCounter += 1);
      }
      nameParts = splitPrefix(name);
      prefix = nameParts[0];
      name = nameParts[1];
      if (prefix) {
        prefix = normalize(prefix, parentName, applyMap);
        pluginModule = getOwn(defined, prefix);
      }
      //Account for relative paths if there is a base name.
      if (name) {
        if (prefix) {
          if (pluginModule && pluginModule.normalize) {
            //Plugin is loaded, use its normalize method.
            normalizedName = pluginModule.normalize(name, function(name) {
              return normalize(name, parentName, applyMap);
            });
          } else {
            normalizedName = normalize(name, parentName, applyMap);
          }
        } else {
          //A regular module.
          normalizedName = normalize(name, parentName, applyMap);
          //Normalized name may be a plugin ID due to map config
          //application in normalize. The map config values must
          //already be normalized, so do not need to redo that part.
          nameParts = splitPrefix(normalizedName);
          prefix = nameParts[0];
          normalizedName = nameParts[1];
          isNormalized = true;
          url = context.nameToUrl(normalizedName);
        }
      }
      //If the id is a plugin id that cannot be determined if it needs
      //normalization, stamp it with a unique ID so two matching relative
      //ids that may conflict can be separate.
      suffix = prefix && !pluginModule && !isNormalized ? "_unnormalized" + (unnormalizedCounter += 1) : "";
      return {
        prefix: prefix,
        name: normalizedName,
        parentMap: parentModuleMap,
        unnormalized: !!suffix,
        url: url,
        originalName: originalName,
        isDefine: isDefine,
        id: (prefix ? prefix + "!" + normalizedName : normalizedName) + suffix
      };
    }
    function getModule(depMap) {
      var id = depMap.id, mod = getOwn(registry, id);
      if (!mod) {
        mod = registry[id] = new context.Module(depMap);
      }
      return mod;
    }
    function on(depMap, name, fn) {
      var id = depMap.id, mod = getOwn(registry, id);
      if (hasProp(defined, id) && (!mod || mod.defineEmitComplete)) {
        if (name === "defined") {
          fn(defined[id]);
        }
      } else {
        mod = getModule(depMap);
        if (mod.error && name === "error") {
          fn(mod.error);
        } else {
          mod.on(name, fn);
        }
      }
    }
    function onError(err, errback) {
      var ids = err.requireModules, notified = false;
      if (errback) {
        errback(err);
      } else {
        each(ids, function(id) {
          var mod = getOwn(registry, id);
          if (mod) {
            //Set error on module, so it skips timeout checks.
            mod.error = err;
            if (mod.events.error) {
              notified = true;
              mod.emit("error", err);
            }
          }
        });
        if (!notified) {
          req.onError(err);
        }
      }
    }
    /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
    function takeGlobalQueue() {
      //Push all the globalDefQueue items into the context's defQueue
      if (globalDefQueue.length) {
        //Array splice in the values since the context code has a
        //local var ref to defQueue, so cannot just reassign the one
        //on context.
        apsp.apply(defQueue, [ defQueue.length - 1, 0 ].concat(globalDefQueue));
        globalDefQueue = [];
      }
    }
    handlers = {
      require: function(mod) {
        if (mod.require) {
          return mod.require;
        } else {
          return mod.require = context.makeRequire(mod.map);
        }
      },
      exports: function(mod) {
        mod.usingExports = true;
        if (mod.map.isDefine) {
          if (mod.exports) {
            return mod.exports;
          } else {
            return mod.exports = defined[mod.map.id] = {};
          }
        }
      },
      module: function(mod) {
        if (mod.module) {
          return mod.module;
        } else {
          return mod.module = {
            id: mod.map.id,
            uri: mod.map.url,
            config: function() {
              var c, pkg = getOwn(config.pkgs, mod.map.id);
              // For packages, only support config targeted
              // at the main module.
              c = pkg ? getOwn(config.config, mod.map.id + "/" + pkg.main) : getOwn(config.config, mod.map.id);
              return c || {};
            },
            exports: defined[mod.map.id]
          };
        }
      }
    };
    function cleanRegistry(id) {
      //Clean up machinery used for waiting modules.
      delete registry[id];
      delete enabledRegistry[id];
    }
    function breakCycle(mod, traced, processed) {
      var id = mod.map.id;
      if (mod.error) {
        mod.emit("error", mod.error);
      } else {
        traced[id] = true;
        each(mod.depMaps, function(depMap, i) {
          var depId = depMap.id, dep = getOwn(registry, depId);
          //Only force things that have not completed
          //being defined, so still in the registry,
          //and only if it has not been matched up
          //in the module already.
          if (dep && !mod.depMatched[i] && !processed[depId]) {
            if (getOwn(traced, depId)) {
              mod.defineDep(i, defined[depId]);
              mod.check();
            } else {
              breakCycle(dep, traced, processed);
            }
          }
        });
        processed[id] = true;
      }
    }
    function checkLoaded() {
      var map, modId, err, usingPathFallback, waitInterval = config.waitSeconds * 1e3, //It is possible to disable the wait interval by using waitSeconds of 0.
      expired = waitInterval && context.startTime + waitInterval < new Date().getTime(), noLoads = [], reqCalls = [], stillLoading = false, needCycleCheck = true;
      //Do not bother if this call was a result of a cycle break.
      if (inCheckLoaded) {
        return;
      }
      inCheckLoaded = true;
      //Figure out the state of all the modules.
      eachProp(enabledRegistry, function(mod) {
        map = mod.map;
        modId = map.id;
        //Skip things that are not enabled or in error state.
        if (!mod.enabled) {
          return;
        }
        if (!map.isDefine) {
          reqCalls.push(mod);
        }
        if (!mod.error) {
          //If the module should be executed, and it has not
          //been inited and time is up, remember it.
          if (!mod.inited && expired) {
            if (hasPathFallback(modId)) {
              usingPathFallback = true;
              stillLoading = true;
            } else {
              noLoads.push(modId);
              removeScript(modId);
            }
          } else if (!mod.inited && mod.fetched && map.isDefine) {
            stillLoading = true;
            if (!map.prefix) {
              //No reason to keep looking for unfinished
              //loading. If the only stillLoading is a
              //plugin resource though, keep going,
              //because it may be that a plugin resource
              //is waiting on a non-plugin cycle.
              return needCycleCheck = false;
            }
          }
        }
      });
      if (expired && noLoads.length) {
        //If wait time expired, throw error of unloaded modules.
        err = makeError("timeout", "Load timeout for modules: " + noLoads, null, noLoads);
        err.contextName = context.contextName;
        return onError(err);
      }
      //Not expired, check for a cycle.
      if (needCycleCheck) {
        each(reqCalls, function(mod) {
          breakCycle(mod, {}, {});
        });
      }
      //If still waiting on loads, and the waiting load is something
      //other than a plugin resource, or there are still outstanding
      //scripts, then just try back later.
      if ((!expired || usingPathFallback) && stillLoading) {
        //Something is still waiting to load. Wait for it, but only
        //if a timeout is not already in effect.
        if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
          checkLoadedTimeoutId = setTimeout(function() {
            checkLoadedTimeoutId = 0;
            checkLoaded();
          }, 50);
        }
      }
      inCheckLoaded = false;
    }
    Module = function(map) {
      this.events = getOwn(undefEvents, map.id) || {};
      this.map = map;
      this.shim = getOwn(config.shim, map.id);
      this.depExports = [];
      this.depMaps = [];
      this.depMatched = [];
      this.pluginMaps = {};
      this.depCount = 0;
    };
    Module.prototype = {
      init: function(depMaps, factory, errback, options) {
        options = options || {};
        //Do not do more inits if already done. Can happen if there
        //are multiple define calls for the same module. That is not
        //a normal, common case, but it is also not unexpected.
        if (this.inited) {
          return;
        }
        this.factory = factory;
        if (errback) {
          //Register for errors on this module.
          this.on("error", errback);
        } else if (this.events.error) {
          //If no errback already, but there are error listeners
          //on this module, set up an errback to pass to the deps.
          errback = bind(this, function(err) {
            this.emit("error", err);
          });
        }
        //Do a copy of the dependency array, so that
        //source inputs are not modified. For example
        //"shim" deps are passed in here directly, and
        //doing a direct modification of the depMaps array
        //would affect that config.
        this.depMaps = depMaps && depMaps.slice(0);
        this.errback = errback;
        //Indicate this module has be initialized
        this.inited = true;
        this.ignore = options.ignore;
        //Could have option to init this module in enabled mode,
        //or could have been previously marked as enabled. However,
        //the dependencies are not known until init is called. So
        //if enabled previously, now trigger dependencies as enabled.
        if (options.enabled || this.enabled) {
          //Enable this module and dependencies.
          //Will call this.check()
          this.enable();
        } else {
          this.check();
        }
      },
      defineDep: function(i, depExports) {
        //Because of cycles, defined callback for a given
        //export can be called more than once.
        if (!this.depMatched[i]) {
          this.depMatched[i] = true;
          this.depCount -= 1;
          this.depExports[i] = depExports;
        }
      },
      fetch: function() {
        if (this.fetched) {
          return;
        }
        this.fetched = true;
        context.startTime = new Date().getTime();
        var map = this.map;
        //If the manager is for a plugin managed resource,
        //ask the plugin to load it now.
        if (this.shim) {
          context.makeRequire(this.map, {
            enableBuildCallback: true
          })(this.shim.deps || [], bind(this, function() {
            return map.prefix ? this.callPlugin() : this.load();
          }));
        } else {
          //Regular dependency.
          return map.prefix ? this.callPlugin() : this.load();
        }
      },
      load: function() {
        var url = this.map.url;
        //Regular dependency.
        if (!urlFetched[url]) {
          urlFetched[url] = true;
          context.load(this.map.id, url);
        }
      },
      /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
      check: function() {
        if (!this.enabled || this.enabling) {
          return;
        }
        var err, cjsModule, id = this.map.id, depExports = this.depExports, exports = this.exports, factory = this.factory;
        if (!this.inited) {
          this.fetch();
        } else if (this.error) {
          this.emit("error", this.error);
        } else if (!this.defining) {
          //The factory could trigger another require call
          //that would result in checking this module to
          //define itself again. If already in the process
          //of doing that, skip this work.
          this.defining = true;
          if (this.depCount < 1 && !this.defined) {
            if (isFunction(factory)) {
              //If there is an error listener, favor passing
              //to that instead of throwing an error. However,
              //only do it for define()'d  modules. require
              //errbacks should not be called for failures in
              //their callbacks (#699). However if a global
              //onError is set, use that.
              if (this.events.error && this.map.isDefine || req.onError !== defaultOnError) {
                try {
                  exports = context.execCb(id, factory, depExports, exports);
                } catch (e) {
                  err = e;
                }
              } else {
                exports = context.execCb(id, factory, depExports, exports);
              }
              if (this.map.isDefine) {
                //If setting exports via 'module' is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                cjsModule = this.module;
                if (cjsModule && cjsModule.exports !== undefined && //Make sure it is not already the exports value
                cjsModule.exports !== this.exports) {
                  exports = cjsModule.exports;
                } else if (exports === undefined && this.usingExports) {
                  //exports already set the defined value.
                  exports = this.exports;
                }
              }
              if (err) {
                err.requireMap = this.map;
                err.requireModules = this.map.isDefine ? [ this.map.id ] : null;
                err.requireType = this.map.isDefine ? "define" : "require";
                return onError(this.error = err);
              }
            } else {
              //Just a literal value
              exports = factory;
            }
            this.exports = exports;
            if (this.map.isDefine && !this.ignore) {
              defined[id] = exports;
              if (req.onResourceLoad) {
                req.onResourceLoad(context, this.map, this.depMaps);
              }
            }
            //Clean up
            cleanRegistry(id);
            this.defined = true;
          }
          //Finished the define stage. Allow calling check again
          //to allow define notifications below in the case of a
          //cycle.
          this.defining = false;
          if (this.defined && !this.defineEmitted) {
            this.defineEmitted = true;
            this.emit("defined", this.exports);
            this.defineEmitComplete = true;
          }
        }
      },
      callPlugin: function() {
        var map = this.map, id = map.id, //Map already normalized the prefix.
        pluginMap = makeModuleMap(map.prefix);
        //Mark this as a dependency for this plugin, so it
        //can be traced for cycles.
        this.depMaps.push(pluginMap);
        on(pluginMap, "defined", bind(this, function(plugin) {
          var load, normalizedMap, normalizedMod, name = this.map.name, parentName = this.map.parentMap ? this.map.parentMap.name : null, localRequire = context.makeRequire(map.parentMap, {
            enableBuildCallback: true
          });
          //If current map is not normalized, wait for that
          //normalized name to load instead of continuing.
          if (this.map.unnormalized) {
            //Normalize the ID if the plugin allows it.
            if (plugin.normalize) {
              name = plugin.normalize(name, function(name) {
                return normalize(name, parentName, true);
              }) || "";
            }
            //prefix and name should already be normalized, no need
            //for applying map config again either.
            normalizedMap = makeModuleMap(map.prefix + "!" + name, this.map.parentMap);
            on(normalizedMap, "defined", bind(this, function(value) {
              this.init([], function() {
                return value;
              }, null, {
                enabled: true,
                ignore: true
              });
            }));
            normalizedMod = getOwn(registry, normalizedMap.id);
            if (normalizedMod) {
              //Mark this as a dependency for this plugin, so it
              //can be traced for cycles.
              this.depMaps.push(normalizedMap);
              if (this.events.error) {
                normalizedMod.on("error", bind(this, function(err) {
                  this.emit("error", err);
                }));
              }
              normalizedMod.enable();
            }
            return;
          }
          load = bind(this, function(value) {
            this.init([], function() {
              return value;
            }, null, {
              enabled: true
            });
          });
          load.error = bind(this, function(err) {
            this.inited = true;
            this.error = err;
            err.requireModules = [ id ];
            //Remove temp unnormalized modules for this module,
            //since they will never be resolved otherwise now.
            eachProp(registry, function(mod) {
              if (mod.map.id.indexOf(id + "_unnormalized") === 0) {
                cleanRegistry(mod.map.id);
              }
            });
            onError(err);
          });
          //Allow plugins to load other code without having to know the
          //context or how to 'complete' the load.
          load.fromText = bind(this, function(text, textAlt) {
            /*jslint evil: true */
            var moduleName = map.name, moduleMap = makeModuleMap(moduleName), hasInteractive = useInteractive;
            //As of 2.1.0, support just passing the text, to reinforce
            //fromText only being called once per resource. Still
            //support old style of passing moduleName but discard
            //that moduleName in favor of the internal ref.
            if (textAlt) {
              text = textAlt;
            }
            //Turn off interactive script matching for IE for any define
            //calls in the text, then turn it back on at the end.
            if (hasInteractive) {
              useInteractive = false;
            }
            //Prime the system by creating a module instance for
            //it.
            getModule(moduleMap);
            //Transfer any config to this other module.
            if (hasProp(config.config, id)) {
              config.config[moduleName] = config.config[id];
            }
            try {
              req.exec(text);
            } catch (e) {
              return onError(makeError("fromtexteval", "fromText eval for " + id + " failed: " + e, e, [ id ]));
            }
            if (hasInteractive) {
              useInteractive = true;
            }
            //Mark this as a dependency for the plugin
            //resource
            this.depMaps.push(moduleMap);
            //Support anonymous modules.
            context.completeLoad(moduleName);
            //Bind the value of that module to the value for this
            //resource ID.
            localRequire([ moduleName ], load);
          });
          //Use parentName here since the plugin's name is not reliable,
          //could be some weird string with no path that actually wants to
          //reference the parentName's path.
          plugin.load(map.name, localRequire, load, config);
        }));
        context.enable(pluginMap, this);
        this.pluginMaps[pluginMap.id] = pluginMap;
      },
      enable: function() {
        enabledRegistry[this.map.id] = this;
        this.enabled = true;
        //Set flag mentioning that the module is enabling,
        //so that immediate calls to the defined callbacks
        //for dependencies do not trigger inadvertent load
        //with the depCount still being zero.
        this.enabling = true;
        //Enable each dependency
        each(this.depMaps, bind(this, function(depMap, i) {
          var id, mod, handler;
          if (typeof depMap === "string") {
            //Dependency needs to be converted to a depMap
            //and wired up to this module.
            depMap = makeModuleMap(depMap, this.map.isDefine ? this.map : this.map.parentMap, false, !this.skipMap);
            this.depMaps[i] = depMap;
            handler = getOwn(handlers, depMap.id);
            if (handler) {
              this.depExports[i] = handler(this);
              return;
            }
            this.depCount += 1;
            on(depMap, "defined", bind(this, function(depExports) {
              this.defineDep(i, depExports);
              this.check();
            }));
            if (this.errback) {
              on(depMap, "error", bind(this, this.errback));
            }
          }
          id = depMap.id;
          mod = registry[id];
          //Skip special modules like 'require', 'exports', 'module'
          //Also, don't call enable if it is already enabled,
          //important in circular dependency cases.
          if (!hasProp(handlers, id) && mod && !mod.enabled) {
            context.enable(depMap, this);
          }
        }));
        //Enable each plugin that is used in
        //a dependency
        eachProp(this.pluginMaps, bind(this, function(pluginMap) {
          var mod = getOwn(registry, pluginMap.id);
          if (mod && !mod.enabled) {
            context.enable(pluginMap, this);
          }
        }));
        this.enabling = false;
        this.check();
      },
      on: function(name, cb) {
        var cbs = this.events[name];
        if (!cbs) {
          cbs = this.events[name] = [];
        }
        cbs.push(cb);
      },
      emit: function(name, evt) {
        each(this.events[name], function(cb) {
          cb(evt);
        });
        if (name === "error") {
          //Now that the error handler was triggered, remove
          //the listeners, since this broken Module instance
          //can stay around for a while in the registry.
          delete this.events[name];
        }
      }
    };
    function callGetModule(args) {
      //Skip modules already defined.
      if (!hasProp(defined, args[0])) {
        getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
      }
    }
    function removeListener(node, func, name, ieName) {
      //Favor detachEvent because of IE9
      //issue, see attachEvent/addEventListener comment elsewhere
      //in this file.
      if (node.detachEvent && !isOpera) {
        //Probably IE. If not it will throw an error, which will be
        //useful to know.
        if (ieName) {
          node.detachEvent(ieName, func);
        }
      } else {
        node.removeEventListener(name, func, false);
      }
    }
    /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
    function getScriptData(evt) {
      //Using currentTarget instead of target for Firefox 2.0's sake. Not
      //all old browsers will be supported, but this one was easy enough
      //to support and still makes sense.
      var node = evt.currentTarget || evt.srcElement;
      //Remove the listeners once here.
      removeListener(node, context.onScriptLoad, "load", "onreadystatechange");
      removeListener(node, context.onScriptError, "error");
      return {
        node: node,
        id: node && node.getAttribute("data-requiremodule")
      };
    }
    function intakeDefines() {
      var args;
      //Any defined modules in the global queue, intake them now.
      takeGlobalQueue();
      //Make sure any remaining defQueue items get properly processed.
      while (defQueue.length) {
        args = defQueue.shift();
        if (args[0] === null) {
          return onError(makeError("mismatch", "Mismatched anonymous define() module: " + args[args.length - 1]));
        } else {
          //args are id, deps, factory. Should be normalized by the
          //define() function.
          callGetModule(args);
        }
      }
    }
    context = {
      config: config,
      contextName: contextName,
      registry: registry,
      defined: defined,
      urlFetched: urlFetched,
      defQueue: defQueue,
      Module: Module,
      makeModuleMap: makeModuleMap,
      nextTick: req.nextTick,
      onError: onError,
      /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
      configure: function(cfg) {
        //Make sure the baseUrl ends in a slash.
        if (cfg.baseUrl) {
          if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== "/") {
            cfg.baseUrl += "/";
          }
        }
        //Save off the paths and packages since they require special processing,
        //they are additive.
        var pkgs = config.pkgs, shim = config.shim, objs = {
          paths: true,
          config: true,
          map: true
        };
        eachProp(cfg, function(value, prop) {
          if (objs[prop]) {
            if (prop === "map") {
              if (!config.map) {
                config.map = {};
              }
              mixin(config[prop], value, true, true);
            } else {
              mixin(config[prop], value, true);
            }
          } else {
            config[prop] = value;
          }
        });
        //Merge shim
        if (cfg.shim) {
          eachProp(cfg.shim, function(value, id) {
            //Normalize the structure
            if (isArray(value)) {
              value = {
                deps: value
              };
            }
            if ((value.exports || value.init) && !value.exportsFn) {
              value.exportsFn = context.makeShimExports(value);
            }
            shim[id] = value;
          });
          config.shim = shim;
        }
        //Adjust packages if necessary.
        if (cfg.packages) {
          each(cfg.packages, function(pkgObj) {
            var location;
            pkgObj = typeof pkgObj === "string" ? {
              name: pkgObj
            } : pkgObj;
            location = pkgObj.location;
            //Create a brand new object on pkgs, since currentPackages can
            //be passed in again, and config.pkgs is the internal transformed
            //state for all package configs.
            pkgs[pkgObj.name] = {
              name: pkgObj.name,
              location: location || pkgObj.name,
              //Remove leading dot in main, so main paths are normalized,
              //and remove any trailing .js, since different package
              //envs have different conventions: some use a module name,
              //some use a file name.
              main: (pkgObj.main || "main").replace(currDirRegExp, "").replace(jsSuffixRegExp, "")
            };
          });
          //Done with modifications, assing packages back to context config
          config.pkgs = pkgs;
        }
        //If there are any "waiting to execute" modules in the registry,
        //update the maps for them, since their info, like URLs to load,
        //may have changed.
        eachProp(registry, function(mod, id) {
          //If module already has init called, since it is too
          //late to modify them, and ignore unnormalized ones
          //since they are transient.
          if (!mod.inited && !mod.map.unnormalized) {
            mod.map = makeModuleMap(id);
          }
        });
        //If a deps array or a config callback is specified, then call
        //require with those args. This is useful when require is defined as a
        //config object before require.js is loaded.
        if (cfg.deps || cfg.callback) {
          context.require(cfg.deps || [], cfg.callback);
        }
      },
      makeShimExports: function(value) {
        function fn() {
          var ret;
          if (value.init) {
            ret = value.init.apply(global, arguments);
          }
          return ret || value.exports && getGlobal(value.exports);
        }
        return fn;
      },
      makeRequire: function(relMap, options) {
        options = options || {};
        function localRequire(deps, callback, errback) {
          var id, map, requireMod;
          if (options.enableBuildCallback && callback && isFunction(callback)) {
            callback.__requireJsBuild = true;
          }
          if (typeof deps === "string") {
            if (isFunction(callback)) {
              //Invalid call
              return onError(makeError("requireargs", "Invalid require call"), errback);
            }
            //If require|exports|module are requested, get the
            //value for them from the special handlers. Caveat:
            //this only works while module is being defined.
            if (relMap && hasProp(handlers, deps)) {
              return handlers[deps](registry[relMap.id]);
            }
            //Synchronous access to one module. If require.get is
            //available (as in the Node adapter), prefer that.
            if (req.get) {
              return req.get(context, deps, relMap, localRequire);
            }
            //Normalize module name, if it contains . or ..
            map = makeModuleMap(deps, relMap, false, true);
            id = map.id;
            if (!hasProp(defined, id)) {
              return onError(makeError("notloaded", 'Module name "' + id + '" has not been loaded yet for context: ' + contextName + (relMap ? "" : ". Use require([])")));
            }
            return defined[id];
          }
          //Grab defines waiting in the global queue.
          intakeDefines();
          //Mark all the dependencies as needing to be loaded.
          context.nextTick(function() {
            //Some defines could have been added since the
            //require call, collect them.
            intakeDefines();
            requireMod = getModule(makeModuleMap(null, relMap));
            //Store if map config should be applied to this require
            //call for dependencies.
            requireMod.skipMap = options.skipMap;
            requireMod.init(deps, callback, errback, {
              enabled: true
            });
            checkLoaded();
          });
          return localRequire;
        }
        mixin(localRequire, {
          isBrowser: isBrowser,
          /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
          toUrl: function(moduleNamePlusExt) {
            var ext, index = moduleNamePlusExt.lastIndexOf("."), segment = moduleNamePlusExt.split("/")[0], isRelative = segment === "." || segment === "..";
            //Have a file extension alias, and it is not the
            //dots from a relative path.
            if (index !== -1 && (!isRelative || index > 1)) {
              ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
              moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
            }
            return context.nameToUrl(normalize(moduleNamePlusExt, relMap && relMap.id, true), ext, true);
          },
          defined: function(id) {
            return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
          },
          specified: function(id) {
            id = makeModuleMap(id, relMap, false, true).id;
            return hasProp(defined, id) || hasProp(registry, id);
          }
        });
        //Only allow undef on top level require calls
        if (!relMap) {
          localRequire.undef = function(id) {
            //Bind any waiting define() calls to this context,
            //fix for #408
            takeGlobalQueue();
            var map = makeModuleMap(id, relMap, true), mod = getOwn(registry, id);
            removeScript(id);
            delete defined[id];
            delete urlFetched[map.url];
            delete undefEvents[id];
            if (mod) {
              //Hold on to listeners in case the
              //module will be attempted to be reloaded
              //using a different config.
              if (mod.events.defined) {
                undefEvents[id] = mod.events;
              }
              cleanRegistry(id);
            }
          };
        }
        return localRequire;
      },
      /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overriden by
             * the optimizer. Not shown here to keep code compact.
             */
      enable: function(depMap) {
        var mod = getOwn(registry, depMap.id);
        if (mod) {
          getModule(depMap).enable();
        }
      },
      /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
      completeLoad: function(moduleName) {
        var found, args, mod, shim = getOwn(config.shim, moduleName) || {}, shExports = shim.exports;
        takeGlobalQueue();
        while (defQueue.length) {
          args = defQueue.shift();
          if (args[0] === null) {
            args[0] = moduleName;
            //If already found an anonymous module and bound it
            //to this name, then this is some other anon module
            //waiting for its completeLoad to fire.
            if (found) {
              break;
            }
            found = true;
          } else if (args[0] === moduleName) {
            //Found matching define call for this script!
            found = true;
          }
          callGetModule(args);
        }
        //Do this after the cycle of callGetModule in case the result
        //of those calls/init calls changes the registry.
        mod = getOwn(registry, moduleName);
        if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
          if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
            if (hasPathFallback(moduleName)) {
              return;
            } else {
              return onError(makeError("nodefine", "No define call for " + moduleName, null, [ moduleName ]));
            }
          } else {
            //A script that does not call define(), so just simulate
            //the call for it.
            callGetModule([ moduleName, shim.deps || [], shim.exportsFn ]);
          }
        }
        checkLoaded();
      },
      /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
      nameToUrl: function(moduleName, ext, skipExt) {
        var paths, pkgs, pkg, pkgPath, syms, i, parentModule, url, parentPath;
        //If a colon is in the URL, it indicates a protocol is used and it is just
        //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
        //or ends with .js, then assume the user meant to use an url and not a module id.
        //The slash is important for protocol-less URLs as well as full paths.
        if (req.jsExtRegExp.test(moduleName)) {
          //Just a plain path, not module name lookup, so just return it.
          //Add extension if it is included. This is a bit wonky, only non-.js things pass
          //an extension, this method probably needs to be reworked.
          url = moduleName + (ext || "");
        } else {
          //A module that needs to be converted to a path.
          paths = config.paths;
          pkgs = config.pkgs;
          syms = moduleName.split("/");
          //For each module name segment, see if there is a path
          //registered for it. Start with most specific name
          //and work up from it.
          for (i = syms.length; i > 0; i -= 1) {
            parentModule = syms.slice(0, i).join("/");
            pkg = getOwn(pkgs, parentModule);
            parentPath = getOwn(paths, parentModule);
            if (parentPath) {
              //If an array, it means there are a few choices,
              //Choose the one that is desired
              if (isArray(parentPath)) {
                parentPath = parentPath[0];
              }
              syms.splice(0, i, parentPath);
              break;
            } else if (pkg) {
              //If module name is just the package name, then looking
              //for the main module.
              if (moduleName === pkg.name) {
                pkgPath = pkg.location + "/" + pkg.main;
              } else {
                pkgPath = pkg.location;
              }
              syms.splice(0, i, pkgPath);
              break;
            }
          }
          //Join the path parts together, then figure out if baseUrl is needed.
          url = syms.join("/");
          url += ext || (/^data\:|\?/.test(url) || skipExt ? "" : ".js");
          url = (url.charAt(0) === "/" || url.match(/^[\w\+\.\-]+:/) ? "" : config.baseUrl) + url;
        }
        return config.urlArgs ? url + ((url.indexOf("?") === -1 ? "?" : "&") + config.urlArgs) : url;
      },
      //Delegates to req.load. Broken out as a separate function to
      //allow overriding in the optimizer.
      load: function(id, url) {
        req.load(context, id, url);
      },
      /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
      execCb: function(name, callback, args, exports) {
        return callback.apply(exports, args);
      },
      /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
      onScriptLoad: function(evt) {
        //Using currentTarget instead of target for Firefox 2.0's sake. Not
        //all old browsers will be supported, but this one was easy enough
        //to support and still makes sense.
        if (evt.type === "load" || readyRegExp.test((evt.currentTarget || evt.srcElement).readyState)) {
          //Reset interactive script so a script node is not held onto for
          //to long.
          interactiveScript = null;
          //Pull out the name of the module and the context.
          var data = getScriptData(evt);
          context.completeLoad(data.id);
        }
      },
      /**
             * Callback for script errors.
             */
      onScriptError: function(evt) {
        var data = getScriptData(evt);
        if (!hasPathFallback(data.id)) {
          return onError(makeError("scripterror", "Script error for: " + data.id, evt, [ data.id ]));
        }
      }
    };
    context.require = context.makeRequire();
    return context;
  }
  /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
  req = requirejs = function(deps, callback, errback, optional) {
    //Find the right context, use default
    var context, config, contextName = defContextName;
    // Determine if have config object in the call.
    if (!isArray(deps) && typeof deps !== "string") {
      // deps is a config object
      config = deps;
      if (isArray(callback)) {
        // Adjust args if there are dependencies
        deps = callback;
        callback = errback;
        errback = optional;
      } else {
        deps = [];
      }
    }
    if (config && config.context) {
      contextName = config.context;
    }
    context = getOwn(contexts, contextName);
    if (!context) {
      context = contexts[contextName] = req.s.newContext(contextName);
    }
    if (config) {
      context.configure(config);
    }
    return context.require(deps, callback, errback);
  };
  /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
  req.config = function(config) {
    return req(config);
  };
  /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
  req.nextTick = typeof setTimeout !== "undefined" ? function(fn) {
    setTimeout(fn, 4);
  } : function(fn) {
    fn();
  };
  /**
     * Export require as a global, but only if it does not already exist.
     */
  if (!require) {
    require = req;
  }
  req.version = version;
  //Used to filter out dependencies that are already paths.
  req.jsExtRegExp = /^\/|:|\?|\.js$/;
  req.isBrowser = isBrowser;
  s = req.s = {
    contexts: contexts,
    newContext: newContext
  };
  //Create default context.
  req({});
  //Exports some context-sensitive methods on global require.
  each([ "toUrl", "undef", "defined", "specified" ], function(prop) {
    //Reference from contexts instead of early binding to default context,
    //so that during builds, the latest instance of the default context
    //with its config gets used.
    req[prop] = function() {
      var ctx = contexts[defContextName];
      return ctx.require[prop].apply(ctx, arguments);
    };
  });
  if (isBrowser) {
    head = s.head = document.getElementsByTagName("head")[0];
    //If BASE tag is in play, using appendChild is a problem for IE6.
    //When that browser dies, this can be removed. Details in this jQuery bug:
    //http://dev.jquery.com/ticket/2709
    baseElement = document.getElementsByTagName("base")[0];
    if (baseElement) {
      head = s.head = baseElement.parentNode;
    }
  }
  /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
  req.onError = defaultOnError;
  /**
     * Creates the node for the load command. Only used in browser envs.
     */
  req.createNode = function(config, moduleName, url) {
    var node = config.xhtml ? document.createElementNS("http://www.w3.org/1999/xhtml", "html:script") : document.createElement("script");
    node.type = config.scriptType || "text/javascript";
    node.charset = "utf-8";
    node.async = true;
    return node;
  };
  /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
  req.load = function(context, moduleName, url) {
    var config = context && context.config || {}, node;
    if (isBrowser) {
      //In the browser so use a script tag
      node = req.createNode(config, moduleName, url);
      node.setAttribute("data-requirecontext", context.contextName);
      node.setAttribute("data-requiremodule", moduleName);
      //Set up load listener. Test attachEvent first because IE9 has
      //a subtle issue in its addEventListener and script onload firings
      //that do not match the behavior of all other browsers with
      //addEventListener support, which fire the onload event for a
      //script right after the script execution. See:
      //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
      //UNFORTUNATELY Opera implements attachEvent but does not follow the script
      //script execution mode.
      if (node.attachEvent && //Check if node.attachEvent is artificially added by custom script or
      //natively supported by browser
      //read https://github.com/jrburke/requirejs/issues/187
      //if we can NOT find [native code] then it must NOT natively supported.
      //in IE8, node.attachEvent does not have toString()
      //Note the test for "[native code" with no closing brace, see:
      //https://github.com/jrburke/requirejs/issues/273
      !(node.attachEvent.toString && node.attachEvent.toString().indexOf("[native code") < 0) && !isOpera) {
        //Probably IE. IE (at least 6-8) do not fire
        //script onload right after executing the script, so
        //we cannot tie the anonymous define call to a name.
        //However, IE reports the script as being in 'interactive'
        //readyState at the time of the define call.
        useInteractive = true;
        node.attachEvent("onreadystatechange", context.onScriptLoad);
      } else {
        node.addEventListener("load", context.onScriptLoad, false);
        node.addEventListener("error", context.onScriptError, false);
      }
      node.src = url;
      //For some cache cases in IE 6-8, the script executes before the end
      //of the appendChild execution, so to tie an anonymous define
      //call to the module name (which is stored on the node), hold on
      //to a reference to this node, but clear after the DOM insertion.
      currentlyAddingScript = node;
      if (baseElement) {
        head.insertBefore(node, baseElement);
      } else {
        head.appendChild(node);
      }
      currentlyAddingScript = null;
      return node;
    } else if (isWebWorker) {
      try {
        //In a web worker, use importScripts. This is not a very
        //efficient use of importScripts, importScripts will block until
        //its script is downloaded and evaluated. However, if web workers
        //are in play, the expectation that a build has been done so that
        //only one script needs to be loaded anyway. This may need to be
        //reevaluated if other use cases become common.
        importScripts(url);
        //Account for anonymous modules
        context.completeLoad(moduleName);
      } catch (e) {
        context.onError(makeError("importscripts", "importScripts failed for " + moduleName + " at " + url, e, [ moduleName ]));
      }
    }
  };
  function getInteractiveScript() {
    if (interactiveScript && interactiveScript.readyState === "interactive") {
      return interactiveScript;
    }
    eachReverse(scripts(), function(script) {
      if (script.readyState === "interactive") {
        return interactiveScript = script;
      }
    });
    return interactiveScript;
  }
  //Look for a data-main script attribute, which could also adjust the baseUrl.
  if (isBrowser && !cfg.skipDataMain) {
    //Figure out baseUrl. Get it from the script tag with require.js in it.
    eachReverse(scripts(), function(script) {
      //Set the 'head' where we can append children by
      //using the script's parent.
      if (!head) {
        head = script.parentNode;
      }
      //Look for a data-main attribute to set main script for the page
      //to load. If it is there, the path to data main becomes the
      //baseUrl, if it is not already set.
      dataMain = script.getAttribute("data-main");
      if (dataMain) {
        //Preserve dataMain in case it is a path (i.e. contains '?')
        mainScript = dataMain;
        //Set final baseUrl if there is not already an explicit one.
        if (!cfg.baseUrl) {
          //Pull off the directory of data-main for use as the
          //baseUrl.
          src = mainScript.split("/");
          mainScript = src.pop();
          subPath = src.length ? src.join("/") + "/" : "./";
          cfg.baseUrl = subPath;
        }
        //Strip off any trailing .js since mainScript is now
        //like a module name.
        mainScript = mainScript.replace(jsSuffixRegExp, "");
        //If mainScript is still a path, fall back to dataMain
        if (req.jsExtRegExp.test(mainScript)) {
          mainScript = dataMain;
        }
        //Put the data-main script in the files to load.
        cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [ mainScript ];
        return true;
      }
    });
  }
  /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
  define = function(name, deps, callback) {
    var node, context;
    //Allow for anonymous modules
    if (typeof name !== "string") {
      //Adjust args appropriately
      callback = deps;
      deps = name;
      name = null;
    }
    //This module may not have dependencies
    if (!isArray(deps)) {
      callback = deps;
      deps = null;
    }
    //If no name, and callback is a function, then figure out if it a
    //CommonJS thing with dependencies.
    if (!deps && isFunction(callback)) {
      deps = [];
      //Remove comments from the callback string,
      //look for require calls, and pull them into the dependencies,
      //but only if there are function args.
      if (callback.length) {
        callback.toString().replace(commentRegExp, "").replace(cjsRequireRegExp, function(match, dep) {
          deps.push(dep);
        });
        //May be a CommonJS thing even without require calls, but still
        //could use exports, and module. Avoid doing exports and module
        //work though if it just needs require.
        //REQUIRES the function to expect the CommonJS variables in the
        //order listed below.
        deps = (callback.length === 1 ? [ "require" ] : [ "require", "exports", "module" ]).concat(deps);
      }
    }
    //If in IE 6-8 and hit an anonymous define() call, do the interactive
    //work.
    if (useInteractive) {
      node = currentlyAddingScript || getInteractiveScript();
      if (node) {
        if (!name) {
          name = node.getAttribute("data-requiremodule");
        }
        context = contexts[node.getAttribute("data-requirecontext")];
      }
    }
    //Always save off evaluating the def call until the script onload handler.
    //This allows multiple modules to be in a file without prematurely
    //tracing dependencies, and allows for anonymous module support,
    //where the module name is not known until the script onload event
    //occurs. If no context, use the global queue, and get it processed
    //in the onscript load callback.
    (context ? context.defQueue : globalDefQueue).push([ name, deps, callback ]);
  };
  define.amd = {
    jQuery: true
  };
  /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
  req.exec = function(text) {
    /*jslint evil: true */
    return eval(text);
  };
  //Set up with config info.
  req(cfg);
})(this);

//     Backbone.js 1.1.0
//     (c) 2010-2011 Jeremy Ashkenas, DocumentCloud Inc.
//     (c) 2011-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
(function() {
  // Initial Setup
  // -------------
  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;
  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;
  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;
  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Backbone;
  if (typeof exports !== "undefined") {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }
  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = "1.1.0";
  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && typeof require !== "undefined") _ = require("underscore");
  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender || root.$;
  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };
  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;
  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;
  // Backbone.Events
  // ---------------
  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {
    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, "on", name, [ callback, context ]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({
        callback: callback,
        context: context,
        ctx: context || this
      });
      return this;
    },
    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, "once", name, [ callback, context ]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },
    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, "off", name, [ callback, context ])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }
      names = name ? [ name ] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }
      return this;
    },
    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, "trigger", name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },
    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === "object") callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }
  };
  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;
  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;
    // Handle event maps.
    if (typeof name === "object") {
      for (var key in name) {
        obj[action].apply(obj, [ key, name[key] ].concat(rest));
      }
      return false;
    }
    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [ names[i] ].concat(rest));
      }
      return false;
    }
    return true;
  };
  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
     case 0:
      while (++i < l) (ev = events[i]).callback.call(ev.ctx);
      return;

     case 1:
      while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1);
      return;

     case 2:
      while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2);
      return;

     case 3:
      while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
      return;

     default:
      while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };
  var listenMethods = {
    listenTo: "on",
    listenToOnce: "once"
  };
  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId("l"));
      listeningTo[id] = obj;
      if (!callback && typeof name === "object") callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });
  // Aliases for backwards compatibility.
  Events.bind = Events.on;
  Events.unbind = Events.off;
  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);
  // Backbone.Model
  // --------------
  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.
  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId("c");
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, "defaults"));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };
  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {
    // A hash of attributes whose current and previous value differ.
    changed: null,
    // The value returned during the last failed validation.
    validationError: null,
    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: "id",
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },
    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },
    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },
    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },
    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },
    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;
      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === "object") {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
      options || (options = {});
      // Run validation.
      if (!this._validate(attrs, options)) return false;
      // Extract attributes and options.
      unset = options.unset;
      silent = options.silent;
      changes = [];
      changing = this._changing;
      this._changing = true;
      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;
      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }
      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger("change:" + changes[i], this, current[changes[i]], options);
        }
      }
      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger("change", this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },
    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {
        unset: true
      }));
    },
    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {
        unset: true
      }));
    },
    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },
    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], val = diff[attr])) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },
    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },
    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },
    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger("sync", model, resp, options);
      };
      wrapError(this, options);
      return this.sync("read", this, options);
    },
    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;
      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === "object") {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
      options = _.extend({
        validate: true
      }, options);
      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }
      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }
      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger("sync", model, resp, options);
      };
      wrapError(this, options);
      method = this.isNew() ? "create" : options.patch ? "patch" : "update";
      if (method === "patch") options.attrs = attrs;
      xhr = this.sync(method, this, options);
      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;
      return xhr;
    },
    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;
      var destroy = function() {
        model.trigger("destroy", model, model.collection, options);
      };
      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger("sync", model, resp, options);
      };
      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);
      var xhr = this.sync("delete", this, options);
      if (!options.wait) destroy();
      return xhr;
    },
    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, "urlRoot") || _.result(this.collection, "url") || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === "/" ? "" : "/") + encodeURIComponent(this.id);
    },
    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },
    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },
    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },
    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, {
        validate: true
      }));
    },
    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger("invalid", this, error, _.extend(options, {
        validationError: error
      }));
      return false;
    }
  });
  // Underscore methods that we want to implement on the Model.
  var modelMethods = [ "keys", "values", "pairs", "invert", "pick", "omit" ];
  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });
  // Backbone.Collection
  // -------------------
  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.
  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({
      silent: true
    }, options));
  };
  // Default options for `Collection#set`.
  var setOptions = {
    add: true,
    remove: true,
    merge: true
  };
  var addOptions = {
    add: true,
    remove: false
  };
  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {
    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model) {
        return model.toJSON(options);
      });
    },
    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },
    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({
        merge: false
      }, options, addOptions));
    },
    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [ models ] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger("remove", model, this, options);
        }
        this._removeReference(model);
      }
      return singular ? models[0] : models;
    },
    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? models ? [ models ] : [] : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && at == null && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;
      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i];
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute];
        }
        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on("all", this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
        if (order) order.push(existing || model);
      }
      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }
      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || order && order.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }
      // Silently sort the collection if appropriate.
      if (sort) this.sort({
        silent: true
      });
      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger("add", model, this, options);
        }
        if (sort || order && order.length) this.trigger("sort", this, options);
      }
      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },
    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({
        silent: true
      }, options));
      if (!options.silent) this.trigger("reset", this, options);
      return models;
    },
    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({
        at: this.length
      }, options));
    },
    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },
    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({
        at: 0
      }, options));
    },
    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },
    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },
    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id] || this._byId[obj.cid] || this._byId[obj];
    },
    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },
    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? "find" : "filter"](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },
    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },
    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error("Cannot sort a set without a comparator");
      options || (options = {});
      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }
      if (!options.silent) this.trigger("sort", this, options);
      return this;
    },
    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, "get", attr);
    },
    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? "reset" : "set";
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger("sync", collection, resp, options);
      };
      wrapError(this, options);
      return this.sync("read", this, options);
    },
    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },
    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },
    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },
    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId = {};
    },
    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger("invalid", this, model.validationError, options);
      return false;
    },
    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off("all", this._onModelEvent, this);
    },
    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === "add" || event === "remove") && collection !== this) return;
      if (event === "destroy") this.remove(model, options);
      if (model && event === "change:" + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }
  });
  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = [ "forEach", "each", "map", "collect", "reduce", "foldl", "inject", "reduceRight", "foldr", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke", "max", "min", "toArray", "size", "first", "head", "take", "initial", "rest", "tail", "drop", "last", "without", "difference", "indexOf", "shuffle", "lastIndexOf", "isEmpty", "chain" ];
  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });
  // Underscore methods that take a property name as an argument.
  var attributeMethods = [ "groupBy", "countBy", "sortBy" ];
  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });
  // Backbone.View
  // -------------
  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.
  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId("view");
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };
  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;
  // List of view options to be merged as properties.
  var viewOptions = [ "model", "collection", "el", "id", "attributes", "className", "tagName", "events" ];
  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {
    // The default `tagName` of a View's element is `"div"`.
    tagName: "div",
    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },
    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },
    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },
    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, "events")))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += ".delegateEvents" + this.cid;
        if (selector === "") {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },
    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off(".delegateEvents" + this.cid);
      return this;
    },
    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, "attributes"));
        if (this.id) attrs.id = _.result(this, "id");
        if (this.className) attrs["class"] = _.result(this, "className");
        var $el = Backbone.$("<" + _.result(this, "tagName") + ">").attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, "el"), false);
      }
    }
  });
  // Backbone.sync
  // -------------
  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];
    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });
    // Default JSON-request options.
    var params = {
      type: type,
      dataType: "json"
    };
    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, "url") || urlError();
    }
    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === "create" || method === "update" || method === "patch")) {
      params.contentType = "application/json";
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }
    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = "application/x-www-form-urlencoded";
      params.data = params.data ? {
        model: params.data
      } : {};
    }
    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === "PUT" || type === "DELETE" || type === "PATCH")) {
      params.type = "POST";
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader("X-HTTP-Method-Override", type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }
    // Don't process data on a non-GET request.
    if (params.type !== "GET" && !options.emulateJSON) {
      params.processData = false;
    }
    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === "PATCH" && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }
    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger("request", model, xhr, options);
    return xhr;
  };
  var noXhrPatch = typeof window !== "undefined" && !!window.ActiveXObject && !(window.XMLHttpRequest && new XMLHttpRequest().dispatchEvent);
  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    create: "POST",
    update: "PUT",
    patch: "PATCH",
    "delete": "DELETE",
    read: "GET"
  };
  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };
  // Backbone.Router
  // ---------------
  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };
  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam = /(\(\?)?:\w+/g;
  var splatParam = /\*\w+/g;
  var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {
    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},
    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = "";
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, [ "route:" + name ].concat(args));
        router.trigger("route", name, args);
        Backbone.history.trigger("route", router, name, args);
      });
      return this;
    },
    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },
    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, "routes");
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },
    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, "\\$&").replace(optionalParam, "(?:$1)?").replace(namedParam, function(match, optional) {
        return optional ? match : "([^/]+)";
      }).replace(splatParam, "(.*?)");
      return new RegExp("^" + route + "$");
    },
    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }
  });
  // Backbone.History
  // ----------------
  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, "checkUrl");
    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== "undefined") {
      this.location = window.location;
      this.history = window.history;
    }
  };
  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;
  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;
  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;
  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;
  // Cached regex for stripping urls of hash and query.
  var pathStripper = /[?#].*$/;
  // Has the history handling already been started?
  History.started = false;
  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {
    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,
    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : "";
    },
    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, "");
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, "");
    },
    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;
      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options = _.extend({
        root: "/"
      }, this.options, options);
      this.root = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState = !!this.options.pushState;
      this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment = this.getFragment();
      var docMode = document.documentMode;
      var oldIE = isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7);
      // Normalize root to always include a leading and trailing slash.
      this.root = ("/" + this.root + "/").replace(rootStripper, "/");
      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow;
        this.navigate(fragment);
      }
      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on("popstate", this.checkUrl);
      } else if (this._wantsHashChange && "onhashchange" in window && !oldIE) {
        Backbone.$(window).on("hashchange", this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }
      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, "$&/") === this.root;
      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {
        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !atRoot) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + this.location.search + "#" + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;
        } else if (this._hasPushState && atRoot && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, "");
          this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
        }
      }
      if (!this.options.silent) return this.loadUrl();
    },
    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off("popstate", this.checkUrl).off("hashchange", this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },
    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({
        route: route,
        callback: callback
      });
    },
    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },
    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },
    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {
        trigger: !!options
      };
      var url = this.root + (fragment = this.getFragment(fragment || ""));
      // Strip the fragment of the query and hash for matching.
      fragment = fragment.replace(pathStripper, "");
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      // Don't include a trailing slash on the root.
      if (fragment === "" && url !== "/") url = url.slice(0, -1);
      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? "replaceState" : "pushState"]({}, document.title, url);
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && fragment !== this.getFragment(this.getHash(this.iframe))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if (!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },
    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, "");
        location.replace(href + "#" + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = "#" + fragment;
      }
    }
  });
  // Create the default Backbone.history.
  Backbone.history = new History();
  // Helpers
  // -------
  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;
    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, "constructor")) {
      child = protoProps.constructor;
    } else {
      child = function() {
        return parent.apply(this, arguments);
      };
    }
    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);
    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function() {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();
    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);
    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;
    return child;
  };
  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;
  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };
  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger("error", model, resp, options);
    };
  };
}).call(this);

//! moment.js
//! version : 2.4.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function(undefined) {
  /************************************
        Constants
    ************************************/
  var moment, VERSION = "2.4.0", round = Math.round, i, YEAR = 0, MONTH = 1, DATE = 2, HOUR = 3, MINUTE = 4, SECOND = 5, MILLISECOND = 6, // internal storage for language config files
  languages = {}, // check for nodeJS
  hasModule = typeof module !== "undefined" && module.exports, // ASP.NET json date format regex
  aspNetJsonRegex = /^\/?Date\((\-?\d+)/i, aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/, // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
  // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
  isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/, // format tokens
  formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g, localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g, // parsing token regexes
  parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
  parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
  parseTokenThreeDigits = /\d{3}/, // 000 - 999
  parseTokenFourDigits = /\d{1,4}/, // 0 - 9999
  parseTokenSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
  parseTokenDigits = /\d+/, // nonzero number of digits
  parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
  parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, // +00:00 -00:00 +0000 -0000 or Z
  parseTokenT = /T/i, // T (ISO seperator)
  parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
  // preliminary iso regex
  // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000)
  isoRegex = /^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d:?\d\d|Z)?)?$/, isoFormat = "YYYY-MM-DDTHH:mm:ssZ", isoDates = [ "YYYY-MM-DD", "GGGG-[W]WW", "GGGG-[W]WW-E", "YYYY-DDD" ], // iso time formats and regexes
  isoTimes = [ [ "HH:mm:ss.SSSS", /(T| )\d\d:\d\d:\d\d\.\d{1,3}/ ], [ "HH:mm:ss", /(T| )\d\d:\d\d:\d\d/ ], [ "HH:mm", /(T| )\d\d:\d\d/ ], [ "HH", /(T| )\d\d/ ] ], // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
  parseTimezoneChunker = /([\+\-]|\d\d)/gi, // getter and setter names
  proxyGettersAndSetters = "Date|Hours|Minutes|Seconds|Milliseconds".split("|"), unitMillisecondFactors = {
    Milliseconds: 1,
    Seconds: 1e3,
    Minutes: 6e4,
    Hours: 36e5,
    Days: 864e5,
    Months: 2592e6,
    Years: 31536e6
  }, unitAliases = {
    ms: "millisecond",
    s: "second",
    m: "minute",
    h: "hour",
    d: "day",
    D: "date",
    w: "week",
    W: "isoWeek",
    M: "month",
    y: "year",
    DDD: "dayOfYear",
    e: "weekday",
    E: "isoWeekday",
    gg: "weekYear",
    GG: "isoWeekYear"
  }, camelFunctions = {
    dayofyear: "dayOfYear",
    isoweekday: "isoWeekday",
    isoweek: "isoWeek",
    weekyear: "weekYear",
    isoweekyear: "isoWeekYear"
  }, // format function strings
  formatFunctions = {}, // tokens to ordinalize and pad
  ordinalizeTokens = "DDD w W M D d".split(" "), paddedTokens = "M D H h m s w W".split(" "), formatTokenFunctions = {
    M: function() {
      return this.month() + 1;
    },
    MMM: function(format) {
      return this.lang().monthsShort(this, format);
    },
    MMMM: function(format) {
      return this.lang().months(this, format);
    },
    D: function() {
      return this.date();
    },
    DDD: function() {
      return this.dayOfYear();
    },
    d: function() {
      return this.day();
    },
    dd: function(format) {
      return this.lang().weekdaysMin(this, format);
    },
    ddd: function(format) {
      return this.lang().weekdaysShort(this, format);
    },
    dddd: function(format) {
      return this.lang().weekdays(this, format);
    },
    w: function() {
      return this.week();
    },
    W: function() {
      return this.isoWeek();
    },
    YY: function() {
      return leftZeroFill(this.year() % 100, 2);
    },
    YYYY: function() {
      return leftZeroFill(this.year(), 4);
    },
    YYYYY: function() {
      return leftZeroFill(this.year(), 5);
    },
    gg: function() {
      return leftZeroFill(this.weekYear() % 100, 2);
    },
    gggg: function() {
      return this.weekYear();
    },
    ggggg: function() {
      return leftZeroFill(this.weekYear(), 5);
    },
    GG: function() {
      return leftZeroFill(this.isoWeekYear() % 100, 2);
    },
    GGGG: function() {
      return this.isoWeekYear();
    },
    GGGGG: function() {
      return leftZeroFill(this.isoWeekYear(), 5);
    },
    e: function() {
      return this.weekday();
    },
    E: function() {
      return this.isoWeekday();
    },
    a: function() {
      return this.lang().meridiem(this.hours(), this.minutes(), true);
    },
    A: function() {
      return this.lang().meridiem(this.hours(), this.minutes(), false);
    },
    H: function() {
      return this.hours();
    },
    h: function() {
      return this.hours() % 12 || 12;
    },
    m: function() {
      return this.minutes();
    },
    s: function() {
      return this.seconds();
    },
    S: function() {
      return toInt(this.milliseconds() / 100);
    },
    SS: function() {
      return leftZeroFill(toInt(this.milliseconds() / 10), 2);
    },
    SSS: function() {
      return leftZeroFill(this.milliseconds(), 3);
    },
    SSSS: function() {
      return leftZeroFill(this.milliseconds(), 3);
    },
    Z: function() {
      var a = -this.zone(), b = "+";
      if (a < 0) {
        a = -a;
        b = "-";
      }
      return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
    },
    ZZ: function() {
      var a = -this.zone(), b = "+";
      if (a < 0) {
        a = -a;
        b = "-";
      }
      return b + leftZeroFill(toInt(10 * a / 6), 4);
    },
    z: function() {
      return this.zoneAbbr();
    },
    zz: function() {
      return this.zoneName();
    },
    X: function() {
      return this.unix();
    }
  }, lists = [ "months", "monthsShort", "weekdays", "weekdaysShort", "weekdaysMin" ];
  function padToken(func, count) {
    return function(a) {
      return leftZeroFill(func.call(this, a), count);
    };
  }
  function ordinalizeToken(func, period) {
    return function(a) {
      return this.lang().ordinal(func.call(this, a), period);
    };
  }
  while (ordinalizeTokens.length) {
    i = ordinalizeTokens.pop();
    formatTokenFunctions[i + "o"] = ordinalizeToken(formatTokenFunctions[i], i);
  }
  while (paddedTokens.length) {
    i = paddedTokens.pop();
    formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
  }
  formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);
  /************************************
        Constructors
    ************************************/
  function Language() {}
  // Moment prototype object
  function Moment(config) {
    checkOverflow(config);
    extend(this, config);
  }
  // Duration Constructor
  function Duration(duration) {
    var normalizedInput = normalizeObjectUnits(duration), years = normalizedInput.year || 0, months = normalizedInput.month || 0, weeks = normalizedInput.week || 0, days = normalizedInput.day || 0, hours = normalizedInput.hour || 0, minutes = normalizedInput.minute || 0, seconds = normalizedInput.second || 0, milliseconds = normalizedInput.millisecond || 0;
    // store reference to input for deterministic cloning
    this._input = duration;
    // representation for dateAddRemove
    this._milliseconds = +milliseconds + seconds * 1e3 + // 1000
    minutes * 6e4 + // 1000 * 60
    hours * 36e5;
    // 1000 * 60 * 60
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days + weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months + years * 12;
    this._data = {};
    this._bubble();
  }
  /************************************
        Helpers
    ************************************/
  function extend(a, b) {
    for (var i in b) {
      if (b.hasOwnProperty(i)) {
        a[i] = b[i];
      }
    }
    if (b.hasOwnProperty("toString")) {
      a.toString = b.toString;
    }
    if (b.hasOwnProperty("valueOf")) {
      a.valueOf = b.valueOf;
    }
    return a;
  }
  function absRound(number) {
    if (number < 0) {
      return Math.ceil(number);
    } else {
      return Math.floor(number);
    }
  }
  // left zero fill a number
  // see http://jsperf.com/left-zero-filling for performance comparison
  function leftZeroFill(number, targetLength) {
    var output = number + "";
    while (output.length < targetLength) {
      output = "0" + output;
    }
    return output;
  }
  // helper function for _.addTime and _.subtractTime
  function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
    var milliseconds = duration._milliseconds, days = duration._days, months = duration._months, minutes, hours;
    if (milliseconds) {
      mom._d.setTime(+mom._d + milliseconds * isAdding);
    }
    // store the minutes and hours so we can restore them
    if (days || months) {
      minutes = mom.minute();
      hours = mom.hour();
    }
    if (days) {
      mom.date(mom.date() + days * isAdding);
    }
    if (months) {
      mom.month(mom.month() + months * isAdding);
    }
    if (milliseconds && !ignoreUpdateOffset) {
      moment.updateOffset(mom);
    }
    // restore the minutes and hours after possibly changing dst
    if (days || months) {
      mom.minute(minutes);
      mom.hour(hours);
    }
  }
  // check if is an array
  function isArray(input) {
    return Object.prototype.toString.call(input) === "[object Array]";
  }
  function isDate(input) {
    return Object.prototype.toString.call(input) === "[object Date]" || input instanceof Date;
  }
  // compare two arrays, return the number of differences
  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length), lengthDiff = Math.abs(array1.length - array2.length), diffs = 0, i;
    for (i = 0; i < len; i++) {
      if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) {
        diffs++;
      }
    }
    return diffs + lengthDiff;
  }
  function normalizeUnits(units) {
    if (units) {
      var lowered = units.toLowerCase().replace(/(.)s$/, "$1");
      units = unitAliases[units] || camelFunctions[lowered] || lowered;
    }
    return units;
  }
  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {}, normalizedProp, prop, index;
    for (prop in inputObject) {
      if (inputObject.hasOwnProperty(prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }
    return normalizedInput;
  }
  function makeList(field) {
    var count, setter;
    if (field.indexOf("week") === 0) {
      count = 7;
      setter = "day";
    } else if (field.indexOf("month") === 0) {
      count = 12;
      setter = "month";
    } else {
      return;
    }
    moment[field] = function(format, index) {
      var i, getter, method = moment.fn._lang[field], results = [];
      if (typeof format === "number") {
        index = format;
        format = undefined;
      }
      getter = function(i) {
        var m = moment().utc().set(setter, i);
        return method.call(moment.fn._lang, m, format || "");
      };
      if (index != null) {
        return getter(index);
      } else {
        for (i = 0; i < count; i++) {
          results.push(getter(i));
        }
        return results;
      }
    };
  }
  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion, value = 0;
    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      if (coercedNumber >= 0) {
        value = Math.floor(coercedNumber);
      } else {
        value = Math.ceil(coercedNumber);
      }
    }
    return value;
  }
  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  }
  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }
  function isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  }
  function checkOverflow(m) {
    var overflow;
    if (m._a && m._pf.overflow === -2) {
      overflow = m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH : m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE : m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR : m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE : m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND : m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND : -1;
      if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
        overflow = DATE;
      }
      m._pf.overflow = overflow;
    }
  }
  function initializeParsingFlags(config) {
    config._pf = {
      empty: false,
      unusedTokens: [],
      unusedInput: [],
      overflow: -2,
      charsLeftOver: 0,
      nullInput: false,
      invalidMonth: null,
      invalidFormat: false,
      userInvalidated: false,
      iso: false
    };
  }
  function isValid(m) {
    if (m._isValid == null) {
      m._isValid = !isNaN(m._d.getTime()) && m._pf.overflow < 0 && !m._pf.empty && !m._pf.invalidMonth && !m._pf.nullInput && !m._pf.invalidFormat && !m._pf.userInvalidated;
      if (m._strict) {
        m._isValid = m._isValid && m._pf.charsLeftOver === 0 && m._pf.unusedTokens.length === 0;
      }
    }
    return m._isValid;
  }
  function normalizeLanguage(key) {
    return key ? key.toLowerCase().replace("_", "-") : key;
  }
  /************************************
        Languages
    ************************************/
  extend(Language.prototype, {
    set: function(config) {
      var prop, i;
      for (i in config) {
        prop = config[i];
        if (typeof prop === "function") {
          this[i] = prop;
        } else {
          this["_" + i] = prop;
        }
      }
    },
    _months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
    months: function(m) {
      return this._months[m.month()];
    },
    _monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
    monthsShort: function(m) {
      return this._monthsShort[m.month()];
    },
    monthsParse: function(monthName) {
      var i, mom, regex;
      if (!this._monthsParse) {
        this._monthsParse = [];
      }
      for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        if (!this._monthsParse[i]) {
          mom = moment.utc([ 2e3, i ]);
          regex = "^" + this.months(mom, "") + "|^" + this.monthsShort(mom, "");
          this._monthsParse[i] = new RegExp(regex.replace(".", ""), "i");
        }
        // test the regex
        if (this._monthsParse[i].test(monthName)) {
          return i;
        }
      }
    },
    _weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
    weekdays: function(m) {
      return this._weekdays[m.day()];
    },
    _weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
    weekdaysShort: function(m) {
      return this._weekdaysShort[m.day()];
    },
    _weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
    weekdaysMin: function(m) {
      return this._weekdaysMin[m.day()];
    },
    weekdaysParse: function(weekdayName) {
      var i, mom, regex;
      if (!this._weekdaysParse) {
        this._weekdaysParse = [];
      }
      for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        if (!this._weekdaysParse[i]) {
          mom = moment([ 2e3, 1 ]).day(i);
          regex = "^" + this.weekdays(mom, "") + "|^" + this.weekdaysShort(mom, "") + "|^" + this.weekdaysMin(mom, "");
          this._weekdaysParse[i] = new RegExp(regex.replace(".", ""), "i");
        }
        // test the regex
        if (this._weekdaysParse[i].test(weekdayName)) {
          return i;
        }
      }
    },
    _longDateFormat: {
      LT: "h:mm A",
      L: "MM/DD/YYYY",
      LL: "MMMM D YYYY",
      LLL: "MMMM D YYYY LT",
      LLLL: "dddd, MMMM D YYYY LT"
    },
    longDateFormat: function(key) {
      var output = this._longDateFormat[key];
      if (!output && this._longDateFormat[key.toUpperCase()]) {
        output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function(val) {
          return val.slice(1);
        });
        this._longDateFormat[key] = output;
      }
      return output;
    },
    isPM: function(input) {
      // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
      // Using charAt should be more compatible.
      return (input + "").toLowerCase().charAt(0) === "p";
    },
    _meridiemParse: /[ap]\.?m?\.?/i,
    meridiem: function(hours, minutes, isLower) {
      if (hours > 11) {
        return isLower ? "pm" : "PM";
      } else {
        return isLower ? "am" : "AM";
      }
    },
    _calendar: {
      sameDay: "[Today at] LT",
      nextDay: "[Tomorrow at] LT",
      nextWeek: "dddd [at] LT",
      lastDay: "[Yesterday at] LT",
      lastWeek: "[Last] dddd [at] LT",
      sameElse: "L"
    },
    calendar: function(key, mom) {
      var output = this._calendar[key];
      return typeof output === "function" ? output.apply(mom) : output;
    },
    _relativeTime: {
      future: "in %s",
      past: "%s ago",
      s: "a few seconds",
      m: "a minute",
      mm: "%d minutes",
      h: "an hour",
      hh: "%d hours",
      d: "a day",
      dd: "%d days",
      M: "a month",
      MM: "%d months",
      y: "a year",
      yy: "%d years"
    },
    relativeTime: function(number, withoutSuffix, string, isFuture) {
      var output = this._relativeTime[string];
      return typeof output === "function" ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
    },
    pastFuture: function(diff, output) {
      var format = this._relativeTime[diff > 0 ? "future" : "past"];
      return typeof format === "function" ? format(output) : format.replace(/%s/i, output);
    },
    ordinal: function(number) {
      return this._ordinal.replace("%d", number);
    },
    _ordinal: "%d",
    preparse: function(string) {
      return string;
    },
    postformat: function(string) {
      return string;
    },
    week: function(mom) {
      return weekOfYear(mom, this._week.dow, this._week.doy).week;
    },
    _week: {
      dow: 0,
      // Sunday is the first day of the week.
      doy: 6
    },
    _invalidDate: "Invalid date",
    invalidDate: function() {
      return this._invalidDate;
    }
  });
  // Loads a language definition into the `languages` cache.  The function
  // takes a key and optionally values.  If not in the browser and no values
  // are provided, it will load the language file module.  As a convenience,
  // this function also returns the language values.
  function loadLang(key, values) {
    values.abbr = key;
    if (!languages[key]) {
      languages[key] = new Language();
    }
    languages[key].set(values);
    return languages[key];
  }
  // Remove a language from the `languages` cache. Mostly useful in tests.
  function unloadLang(key) {
    delete languages[key];
  }
  // Determines which language definition to use and returns it.
  //
  // With no parameters, it will return the global language.  If you
  // pass in a language key, such as 'en', it will return the
  // definition for 'en', so long as 'en' has already been loaded using
  // moment.lang.
  function getLangDefinition(key) {
    var i = 0, j, lang, next, split, get = function(k) {
      if (!languages[k] && hasModule) {
        try {
          require("./lang/" + k);
        } catch (e) {}
      }
      return languages[k];
    };
    if (!key) {
      return moment.fn._lang;
    }
    if (!isArray(key)) {
      //short-circuit everything else
      lang = get(key);
      if (lang) {
        return lang;
      }
      key = [ key ];
    }
    //pick the language from the array
    //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    while (i < key.length) {
      split = normalizeLanguage(key[i]).split("-");
      j = split.length;
      next = normalizeLanguage(key[i + 1]);
      next = next ? next.split("-") : null;
      while (j > 0) {
        lang = get(split.slice(0, j).join("-"));
        if (lang) {
          return lang;
        }
        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
          //the next array item is better than a shallower substring of this one
          break;
        }
        j--;
      }
      i++;
    }
    return moment.fn._lang;
  }
  /************************************
        Formatting
    ************************************/
  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, "");
    }
    return input.replace(/\\/g, "");
  }
  function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;
    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }
    return function(mom) {
      var output = "";
      for (i = 0; i < length; i++) {
        output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
      }
      return output;
    };
  }
  // format date using native date object
  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.lang().invalidDate();
    }
    format = expandFormat(format, m.lang());
    if (!formatFunctions[format]) {
      formatFunctions[format] = makeFormatFunction(format);
    }
    return formatFunctions[format](m);
  }
  function expandFormat(format, lang) {
    var i = 5;
    function replaceLongDateFormatTokens(input) {
      return lang.longDateFormat(input) || input;
    }
    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }
    return format;
  }
  /************************************
        Parsing
    ************************************/
  // get the regex to find the next token
  function getParseRegexForToken(token, config) {
    var a;
    switch (token) {
     case "DDDD":
      return parseTokenThreeDigits;

     case "YYYY":
     case "GGGG":
     case "gggg":
      return parseTokenFourDigits;

     case "YYYYY":
     case "GGGGG":
     case "ggggg":
      return parseTokenSixDigits;

     case "S":
     case "SS":
     case "SSS":
     case "DDD":
      return parseTokenOneToThreeDigits;

     case "MMM":
     case "MMMM":
     case "dd":
     case "ddd":
     case "dddd":
      return parseTokenWord;

     case "a":
     case "A":
      return getLangDefinition(config._l)._meridiemParse;

     case "X":
      return parseTokenTimestampMs;

     case "Z":
     case "ZZ":
      return parseTokenTimezone;

     case "T":
      return parseTokenT;

     case "SSSS":
      return parseTokenDigits;

     case "MM":
     case "DD":
     case "YY":
     case "GG":
     case "gg":
     case "HH":
     case "hh":
     case "mm":
     case "ss":
     case "M":
     case "D":
     case "d":
     case "H":
     case "h":
     case "m":
     case "s":
     case "w":
     case "ww":
     case "W":
     case "WW":
     case "e":
     case "E":
      return parseTokenOneOrTwoDigits;

     default:
      a = new RegExp(regexpEscape(unescapeFormat(token.replace("\\", "")), "i"));
      return a;
    }
  }
  function timezoneMinutesFromString(string) {
    var tzchunk = (parseTokenTimezone.exec(string) || [])[0], parts = (tzchunk + "").match(parseTimezoneChunker) || [ "-", 0, 0 ], minutes = +(parts[1] * 60) + toInt(parts[2]);
    return parts[0] === "+" ? -minutes : minutes;
  }
  // function to convert string input to date
  function addTimeToArrayFromToken(token, input, config) {
    var a, datePartArray = config._a;
    switch (token) {
     // MONTH
      case "M":
     // fall through to MM
      case "MM":
      if (input != null) {
        datePartArray[MONTH] = toInt(input) - 1;
      }
      break;

     case "MMM":
     // fall through to MMMM
      case "MMMM":
      a = getLangDefinition(config._l).monthsParse(input);
      // if we didn't find a month name, mark the date as invalid.
      if (a != null) {
        datePartArray[MONTH] = a;
      } else {
        config._pf.invalidMonth = input;
      }
      break;

     // DAY OF MONTH
      case "D":
     // fall through to DD
      case "DD":
      if (input != null) {
        datePartArray[DATE] = toInt(input);
      }
      break;

     // DAY OF YEAR
      case "DDD":
     // fall through to DDDD
      case "DDDD":
      if (input != null) {
        config._dayOfYear = toInt(input);
      }
      break;

     // YEAR
      case "YY":
      datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900 : 2e3);
      break;

     case "YYYY":
     case "YYYYY":
      datePartArray[YEAR] = toInt(input);
      break;

     // AM / PM
      case "a":
     // fall through to A
      case "A":
      config._isPm = getLangDefinition(config._l).isPM(input);
      break;

     // 24 HOUR
      case "H":
     // fall through to hh
      case "HH":
     // fall through to hh
      case "h":
     // fall through to hh
      case "hh":
      datePartArray[HOUR] = toInt(input);
      break;

     // MINUTE
      case "m":
     // fall through to mm
      case "mm":
      datePartArray[MINUTE] = toInt(input);
      break;

     // SECOND
      case "s":
     // fall through to ss
      case "ss":
      datePartArray[SECOND] = toInt(input);
      break;

     // MILLISECOND
      case "S":
     case "SS":
     case "SSS":
     case "SSSS":
      datePartArray[MILLISECOND] = toInt(("0." + input) * 1e3);
      break;

     // UNIX TIMESTAMP WITH MS
      case "X":
      config._d = new Date(parseFloat(input) * 1e3);
      break;

     // TIMEZONE
      case "Z":
     // fall through to ZZ
      case "ZZ":
      config._useUTC = true;
      config._tzm = timezoneMinutesFromString(input);
      break;

     case "w":
     case "ww":
     case "W":
     case "WW":
     case "d":
     case "dd":
     case "ddd":
     case "dddd":
     case "e":
     case "E":
      token = token.substr(0, 1);

     /* falls through */
      case "gg":
     case "gggg":
     case "GG":
     case "GGGG":
     case "GGGGG":
      token = token.substr(0, 2);
      if (input) {
        config._w = config._w || {};
        config._w[token] = input;
      }
      break;
    }
  }
  // convert an array to a date.
  // the array should mirror the parameters below
  // note: all values past the year are optional and will default to the lowest possible value.
  // [year, month, day , hour, minute, second, millisecond]
  function dateFromConfig(config) {
    var i, date, input = [], currentDate, yearToUse, fixYear, w, temp, lang, weekday, week;
    if (config._d) {
      return;
    }
    currentDate = currentDateArray(config);
    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      fixYear = function(val) {
        return val ? val.length < 3 ? parseInt(val, 10) > 68 ? "19" + val : "20" + val : val : config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR];
      };
      w = config._w;
      if (w.GG != null || w.W != null || w.E != null) {
        temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
      } else {
        lang = getLangDefinition(config._l);
        weekday = w.d != null ? parseWeekday(w.d, lang) : w.e != null ? parseInt(w.e, 10) + lang._week.dow : 0;
        week = parseInt(w.w, 10) || 1;
        //if we're parsing 'd', then the low day numbers may be next week
        if (w.d != null && weekday < lang._week.dow) {
          week++;
        }
        temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
      }
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
    //if the day of the year is set, figure out what it is
    if (config._dayOfYear) {
      yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];
      if (config._dayOfYear > daysInYear(yearToUse)) {
        config._pf._overflowDayOfYear = true;
      }
      date = makeUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }
    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }
    // Zero out whatever was not defaulted, including time
    for (;i < 7; i++) {
      config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    }
    // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
    input[HOUR] += toInt((config._tzm || 0) / 60);
    input[MINUTE] += toInt((config._tzm || 0) % 60);
    config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
  }
  function dateFromObject(config) {
    var normalizedInput;
    if (config._d) {
      return;
    }
    normalizedInput = normalizeObjectUnits(config._i);
    config._a = [ normalizedInput.year, normalizedInput.month, normalizedInput.day, normalizedInput.hour, normalizedInput.minute, normalizedInput.second, normalizedInput.millisecond ];
    dateFromConfig(config);
  }
  function currentDateArray(config) {
    var now = new Date();
    if (config._useUTC) {
      return [ now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() ];
    } else {
      return [ now.getFullYear(), now.getMonth(), now.getDate() ];
    }
  }
  // date from string and format string
  function makeDateFromStringAndFormat(config) {
    config._a = [];
    config._pf.empty = true;
    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var lang = getLangDefinition(config._l), string = "" + config._i, i, parsedInput, tokens, token, skipped, stringLength = string.length, totalParsedInputLength = 0;
    tokens = expandFormat(config._f, lang).match(formattingTokens) || [];
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (getParseRegexForToken(token, config).exec(string) || [])[0];
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) {
          config._pf.unusedInput.push(skipped);
        }
        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length;
      }
      // don't parse if it's not a known token
      if (formatTokenFunctions[token]) {
        if (parsedInput) {
          config._pf.empty = false;
        } else {
          config._pf.unusedTokens.push(token);
        }
        addTimeToArrayFromToken(token, parsedInput, config);
      } else if (config._strict && !parsedInput) {
        config._pf.unusedTokens.push(token);
      }
    }
    // add remaining unparsed input length to the string
    config._pf.charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      config._pf.unusedInput.push(string);
    }
    // handle am pm
    if (config._isPm && config._a[HOUR] < 12) {
      config._a[HOUR] += 12;
    }
    // if is 12 am, change hours to 0
    if (config._isPm === false && config._a[HOUR] === 12) {
      config._a[HOUR] = 0;
    }
    dateFromConfig(config);
    checkOverflow(config);
  }
  function unescapeFormat(s) {
    return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function(matched, p1, p2, p3, p4) {
      return p1 || p2 || p3 || p4;
    });
  }
  // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  function regexpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }
  // date from string and array of format strings
  function makeDateFromStringAndArray(config) {
    var tempConfig, bestMoment, scoreToBeat, i, currentScore;
    if (config._f.length === 0) {
      config._pf.invalidFormat = true;
      config._d = new Date(NaN);
      return;
    }
    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      tempConfig = extend({}, config);
      initializeParsingFlags(tempConfig);
      tempConfig._f = config._f[i];
      makeDateFromStringAndFormat(tempConfig);
      if (!isValid(tempConfig)) {
        continue;
      }
      // if there is any input that was not parsed add a penalty for that format
      currentScore += tempConfig._pf.charsLeftOver;
      //or tokens
      currentScore += tempConfig._pf.unusedTokens.length * 10;
      tempConfig._pf.score = currentScore;
      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig;
      }
    }
    extend(config, bestMoment || tempConfig);
  }
  // date from iso format
  function makeDateFromString(config) {
    var i, string = config._i, match = isoRegex.exec(string);
    if (match) {
      config._pf.iso = true;
      for (i = 4; i > 0; i--) {
        if (match[i]) {
          // match[5] should be "T" or undefined
          config._f = isoDates[i - 1] + (match[6] || " ");
          break;
        }
      }
      for (i = 0; i < 4; i++) {
        if (isoTimes[i][1].exec(string)) {
          config._f += isoTimes[i][0];
          break;
        }
      }
      if (parseTokenTimezone.exec(string)) {
        config._f += "Z";
      }
      makeDateFromStringAndFormat(config);
    } else {
      config._d = new Date(string);
    }
  }
  function makeDateFromInput(config) {
    var input = config._i, matched = aspNetJsonRegex.exec(input);
    if (input === undefined) {
      config._d = new Date();
    } else if (matched) {
      config._d = new Date(+matched[1]);
    } else if (typeof input === "string") {
      makeDateFromString(config);
    } else if (isArray(input)) {
      config._a = input.slice(0);
      dateFromConfig(config);
    } else if (isDate(input)) {
      config._d = new Date(+input);
    } else if (typeof input === "object") {
      dateFromObject(config);
    } else {
      config._d = new Date(input);
    }
  }
  function makeDate(y, m, d, h, M, s, ms) {
    //can't just apply() to create a date:
    //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
    var date = new Date(y, m, d, h, M, s, ms);
    //the date constructor doesn't accept years < 1970
    if (y < 1970) {
      date.setFullYear(y);
    }
    return date;
  }
  function makeUTCDate(y) {
    var date = new Date(Date.UTC.apply(null, arguments));
    if (y < 1970) {
      date.setUTCFullYear(y);
    }
    return date;
  }
  function parseWeekday(input, language) {
    if (typeof input === "string") {
      if (!isNaN(input)) {
        input = parseInt(input, 10);
      } else {
        input = language.weekdaysParse(input);
        if (typeof input !== "number") {
          return null;
        }
      }
    }
    return input;
  }
  /************************************
        Relative Time
    ************************************/
  // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
    return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }
  function relativeTime(milliseconds, withoutSuffix, lang) {
    var seconds = round(Math.abs(milliseconds) / 1e3), minutes = round(seconds / 60), hours = round(minutes / 60), days = round(hours / 24), years = round(days / 365), args = seconds < 45 && [ "s", seconds ] || minutes === 1 && [ "m" ] || minutes < 45 && [ "mm", minutes ] || hours === 1 && [ "h" ] || hours < 22 && [ "hh", hours ] || days === 1 && [ "d" ] || days <= 25 && [ "dd", days ] || days <= 45 && [ "M" ] || days < 345 && [ "MM", round(days / 30) ] || years === 1 && [ "y" ] || [ "yy", years ];
    args[2] = withoutSuffix;
    args[3] = milliseconds > 0;
    args[4] = lang;
    return substituteTimeAgo.apply({}, args);
  }
  /************************************
        Week of Year
    ************************************/
  // firstDayOfWeek       0 = sun, 6 = sat
  //                      the day of the week that starts the week
  //                      (usually sunday or monday)
  // firstDayOfWeekOfYear 0 = sun, 6 = sat
  //                      the first week is the week that contains the first
  //                      of this day of the week
  //                      (eg. ISO weeks use thursday (4))
  function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
    var end = firstDayOfWeekOfYear - firstDayOfWeek, daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(), adjustedMoment;
    if (daysToDayOfWeek > end) {
      daysToDayOfWeek -= 7;
    }
    if (daysToDayOfWeek < end - 7) {
      daysToDayOfWeek += 7;
    }
    adjustedMoment = moment(mom).add("d", daysToDayOfWeek);
    return {
      week: Math.ceil(adjustedMoment.dayOfYear() / 7),
      year: adjustedMoment.year()
    };
  }
  //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
  function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
    var d = new Date(Date.UTC(year, 0)).getUTCDay(), daysToAdd, dayOfYear;
    weekday = weekday != null ? weekday : firstDayOfWeek;
    daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0);
    dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;
    return {
      year: dayOfYear > 0 ? year : year - 1,
      dayOfYear: dayOfYear > 0 ? dayOfYear : daysInYear(year - 1) + dayOfYear
    };
  }
  /************************************
        Top Level Functions
    ************************************/
  function makeMoment(config) {
    var input = config._i, format = config._f;
    if (typeof config._pf === "undefined") {
      initializeParsingFlags(config);
    }
    if (input === null) {
      return moment.invalid({
        nullInput: true
      });
    }
    if (typeof input === "string") {
      config._i = input = getLangDefinition().preparse(input);
    }
    if (moment.isMoment(input)) {
      config = extend({}, input);
      config._d = new Date(+input._d);
    } else if (format) {
      if (isArray(format)) {
        makeDateFromStringAndArray(config);
      } else {
        makeDateFromStringAndFormat(config);
      }
    } else {
      makeDateFromInput(config);
    }
    return new Moment(config);
  }
  moment = function(input, format, lang, strict) {
    if (typeof lang === "boolean") {
      strict = lang;
      lang = undefined;
    }
    return makeMoment({
      _i: input,
      _f: format,
      _l: lang,
      _strict: strict,
      _isUTC: false
    });
  };
  // creating with utc
  moment.utc = function(input, format, lang, strict) {
    var m;
    if (typeof lang === "boolean") {
      strict = lang;
      lang = undefined;
    }
    m = makeMoment({
      _useUTC: true,
      _isUTC: true,
      _l: lang,
      _i: input,
      _f: format,
      _strict: strict
    }).utc();
    return m;
  };
  // creating with unix timestamp (in seconds)
  moment.unix = function(input) {
    return moment(input * 1e3);
  };
  // duration
  moment.duration = function(input, key) {
    var isDuration = moment.isDuration(input), isNumber = typeof input === "number", duration = isDuration ? input._input : isNumber ? {} : input, // matching against regexp is expensive, do it on demand
    match = null, sign, ret, parseIso, timeEmpty, dateTimeEmpty;
    if (isNumber) {
      if (key) {
        duration[key] = input;
      } else {
        duration.milliseconds = input;
      }
    } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
      sign = match[1] === "-" ? -1 : 1;
      duration = {
        y: 0,
        d: toInt(match[DATE]) * sign,
        h: toInt(match[HOUR]) * sign,
        m: toInt(match[MINUTE]) * sign,
        s: toInt(match[SECOND]) * sign,
        ms: toInt(match[MILLISECOND]) * sign
      };
    } else if (!!(match = isoDurationRegex.exec(input))) {
      sign = match[1] === "-" ? -1 : 1;
      parseIso = function(inp) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(",", "."));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
      };
      duration = {
        y: parseIso(match[2]),
        M: parseIso(match[3]),
        d: parseIso(match[4]),
        h: parseIso(match[5]),
        m: parseIso(match[6]),
        s: parseIso(match[7]),
        w: parseIso(match[8])
      };
    }
    ret = new Duration(duration);
    if (isDuration && input.hasOwnProperty("_lang")) {
      ret._lang = input._lang;
    }
    return ret;
  };
  // version number
  moment.version = VERSION;
  // default format
  moment.defaultFormat = isoFormat;
  // This function will be called whenever a moment is mutated.
  // It is intended to keep the offset in sync with the timezone.
  moment.updateOffset = function() {};
  // This function will load languages and then set the global language.  If
  // no arguments are passed in, it will simply return the current global
  // language key.
  moment.lang = function(key, values) {
    var r;
    if (!key) {
      return moment.fn._lang._abbr;
    }
    if (values) {
      loadLang(normalizeLanguage(key), values);
    } else if (values === null) {
      unloadLang(key);
      key = "en";
    } else if (!languages[key]) {
      getLangDefinition(key);
    }
    r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
    return r._abbr;
  };
  // returns language data
  moment.langData = function(key) {
    if (key && key._lang && key._lang._abbr) {
      key = key._lang._abbr;
    }
    return getLangDefinition(key);
  };
  // compare moment object
  moment.isMoment = function(obj) {
    return obj instanceof Moment;
  };
  // for typechecking Duration objects
  moment.isDuration = function(obj) {
    return obj instanceof Duration;
  };
  for (i = lists.length - 1; i >= 0; --i) {
    makeList(lists[i]);
  }
  moment.normalizeUnits = function(units) {
    return normalizeUnits(units);
  };
  moment.invalid = function(flags) {
    var m = moment.utc(NaN);
    if (flags != null) {
      extend(m._pf, flags);
    } else {
      m._pf.userInvalidated = true;
    }
    return m;
  };
  moment.parseZone = function(input) {
    return moment(input).parseZone();
  };
  /************************************
        Moment Prototype
    ************************************/
  extend(moment.fn = Moment.prototype, {
    clone: function() {
      return moment(this);
    },
    valueOf: function() {
      return +this._d + (this._offset || 0) * 6e4;
    },
    unix: function() {
      return Math.floor(+this / 1e3);
    },
    toString: function() {
      return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
    },
    toDate: function() {
      return this._offset ? new Date(+this) : this._d;
    },
    toISOString: function() {
      return formatMoment(moment(this).utc(), "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
    },
    toArray: function() {
      var m = this;
      return [ m.year(), m.month(), m.date(), m.hours(), m.minutes(), m.seconds(), m.milliseconds() ];
    },
    isValid: function() {
      return isValid(this);
    },
    isDSTShifted: function() {
      if (this._a) {
        return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
      }
      return false;
    },
    parsingFlags: function() {
      return extend({}, this._pf);
    },
    invalidAt: function() {
      return this._pf.overflow;
    },
    utc: function() {
      return this.zone(0);
    },
    local: function() {
      this.zone(0);
      this._isUTC = false;
      return this;
    },
    format: function(inputString) {
      var output = formatMoment(this, inputString || moment.defaultFormat);
      return this.lang().postformat(output);
    },
    add: function(input, val) {
      var dur;
      // switch args to support add('s', 1) and add(1, 's')
      if (typeof input === "string") {
        dur = moment.duration(+val, input);
      } else {
        dur = moment.duration(input, val);
      }
      addOrSubtractDurationFromMoment(this, dur, 1);
      return this;
    },
    subtract: function(input, val) {
      var dur;
      // switch args to support subtract('s', 1) and subtract(1, 's')
      if (typeof input === "string") {
        dur = moment.duration(+val, input);
      } else {
        dur = moment.duration(input, val);
      }
      addOrSubtractDurationFromMoment(this, dur, -1);
      return this;
    },
    diff: function(input, units, asFloat) {
      var that = this._isUTC ? moment(input).zone(this._offset || 0) : moment(input).local(), zoneDiff = (this.zone() - that.zone()) * 6e4, diff, output;
      units = normalizeUnits(units);
      if (units === "year" || units === "month") {
        // average number of days in the months in the given dates
        diff = (this.daysInMonth() + that.daysInMonth()) * 432e5;
        // 24 * 60 * 60 * 1000 / 2
        // difference in months
        output = (this.year() - that.year()) * 12 + (this.month() - that.month());
        // adjust by taking difference in days, average number of days
        // and dst in the given months.
        output += (this - moment(this).startOf("month") - (that - moment(that).startOf("month"))) / diff;
        // same as above but with zones, to negate all dst
        output -= (this.zone() - moment(this).startOf("month").zone() - (that.zone() - moment(that).startOf("month").zone())) * 6e4 / diff;
        if (units === "year") {
          output = output / 12;
        }
      } else {
        diff = this - that;
        output = units === "second" ? diff / 1e3 : // 1000
        units === "minute" ? diff / 6e4 : // 1000 * 60
        units === "hour" ? diff / 36e5 : // 1000 * 60 * 60
        units === "day" ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
        units === "week" ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
        diff;
      }
      return asFloat ? output : absRound(output);
    },
    from: function(time, withoutSuffix) {
      return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
    },
    fromNow: function(withoutSuffix) {
      return this.from(moment(), withoutSuffix);
    },
    calendar: function() {
      var diff = this.diff(moment().zone(this.zone()).startOf("day"), "days", true), format = diff < -6 ? "sameElse" : diff < -1 ? "lastWeek" : diff < 0 ? "lastDay" : diff < 1 ? "sameDay" : diff < 2 ? "nextDay" : diff < 7 ? "nextWeek" : "sameElse";
      return this.format(this.lang().calendar(format, this));
    },
    isLeapYear: function() {
      return isLeapYear(this.year());
    },
    isDST: function() {
      return this.zone() < this.clone().month(0).zone() || this.zone() < this.clone().month(5).zone();
    },
    day: function(input) {
      var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
      if (input != null) {
        input = parseWeekday(input, this.lang());
        return this.add({
          d: input - day
        });
      } else {
        return day;
      }
    },
    month: function(input) {
      var utc = this._isUTC ? "UTC" : "", dayOfMonth;
      if (input != null) {
        if (typeof input === "string") {
          input = this.lang().monthsParse(input);
          if (typeof input !== "number") {
            return this;
          }
        }
        dayOfMonth = this.date();
        this.date(1);
        this._d["set" + utc + "Month"](input);
        this.date(Math.min(dayOfMonth, this.daysInMonth()));
        moment.updateOffset(this);
        return this;
      } else {
        return this._d["get" + utc + "Month"]();
      }
    },
    startOf: function(units) {
      units = normalizeUnits(units);
      // the following switch intentionally omits break keywords
      // to utilize falling through the cases.
      switch (units) {
       case "year":
        this.month(0);

       /* falls through */
        case "month":
        this.date(1);

       /* falls through */
        case "week":
       case "isoWeek":
       case "day":
        this.hours(0);

       /* falls through */
        case "hour":
        this.minutes(0);

       /* falls through */
        case "minute":
        this.seconds(0);

       /* falls through */
        case "second":
        this.milliseconds(0);
      }
      // weeks are a special case
      if (units === "week") {
        this.weekday(0);
      } else if (units === "isoWeek") {
        this.isoWeekday(1);
      }
      return this;
    },
    endOf: function(units) {
      units = normalizeUnits(units);
      return this.startOf(units).add(units === "isoWeek" ? "week" : units, 1).subtract("ms", 1);
    },
    isAfter: function(input, units) {
      units = typeof units !== "undefined" ? units : "millisecond";
      return +this.clone().startOf(units) > +moment(input).startOf(units);
    },
    isBefore: function(input, units) {
      units = typeof units !== "undefined" ? units : "millisecond";
      return +this.clone().startOf(units) < +moment(input).startOf(units);
    },
    isSame: function(input, units) {
      units = typeof units !== "undefined" ? units : "millisecond";
      return +this.clone().startOf(units) === +moment(input).startOf(units);
    },
    min: function(other) {
      other = moment.apply(null, arguments);
      return other < this ? this : other;
    },
    max: function(other) {
      other = moment.apply(null, arguments);
      return other > this ? this : other;
    },
    zone: function(input) {
      var offset = this._offset || 0;
      if (input != null) {
        if (typeof input === "string") {
          input = timezoneMinutesFromString(input);
        }
        if (Math.abs(input) < 16) {
          input = input * 60;
        }
        this._offset = input;
        this._isUTC = true;
        if (offset !== input) {
          addOrSubtractDurationFromMoment(this, moment.duration(offset - input, "m"), 1, true);
        }
      } else {
        return this._isUTC ? offset : this._d.getTimezoneOffset();
      }
      return this;
    },
    zoneAbbr: function() {
      return this._isUTC ? "UTC" : "";
    },
    zoneName: function() {
      return this._isUTC ? "Coordinated Universal Time" : "";
    },
    parseZone: function() {
      if (typeof this._i === "string") {
        this.zone(this._i);
      }
      return this;
    },
    hasAlignedHourOffset: function(input) {
      if (!input) {
        input = 0;
      } else {
        input = moment(input).zone();
      }
      return (this.zone() - input) % 60 === 0;
    },
    daysInMonth: function() {
      return daysInMonth(this.year(), this.month());
    },
    dayOfYear: function(input) {
      var dayOfYear = round((moment(this).startOf("day") - moment(this).startOf("year")) / 864e5) + 1;
      return input == null ? dayOfYear : this.add("d", input - dayOfYear);
    },
    weekYear: function(input) {
      var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
      return input == null ? year : this.add("y", input - year);
    },
    isoWeekYear: function(input) {
      var year = weekOfYear(this, 1, 4).year;
      return input == null ? year : this.add("y", input - year);
    },
    week: function(input) {
      var week = this.lang().week(this);
      return input == null ? week : this.add("d", (input - week) * 7);
    },
    isoWeek: function(input) {
      var week = weekOfYear(this, 1, 4).week;
      return input == null ? week : this.add("d", (input - week) * 7);
    },
    weekday: function(input) {
      var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
      return input == null ? weekday : this.add("d", input - weekday);
    },
    isoWeekday: function(input) {
      // behaves the same as moment#day except
      // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
      // as a setter, sunday should belong to the previous week.
      return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
    },
    get: function(units) {
      units = normalizeUnits(units);
      return this[units]();
    },
    set: function(units, value) {
      units = normalizeUnits(units);
      if (typeof this[units] === "function") {
        this[units](value);
      }
      return this;
    },
    // If passed a language key, it will set the language for this
    // instance.  Otherwise, it will return the language configuration
    // variables for this instance.
    lang: function(key) {
      if (key === undefined) {
        return this._lang;
      } else {
        this._lang = getLangDefinition(key);
        return this;
      }
    }
  });
  // helper for adding shortcuts
  function makeGetterAndSetter(name, key) {
    moment.fn[name] = moment.fn[name + "s"] = function(input) {
      var utc = this._isUTC ? "UTC" : "";
      if (input != null) {
        this._d["set" + utc + key](input);
        moment.updateOffset(this);
        return this;
      } else {
        return this._d["get" + utc + key]();
      }
    };
  }
  // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
  for (i = 0; i < proxyGettersAndSetters.length; i++) {
    makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ""), proxyGettersAndSetters[i]);
  }
  // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
  makeGetterAndSetter("year", "FullYear");
  // add plural methods
  moment.fn.days = moment.fn.day;
  moment.fn.months = moment.fn.month;
  moment.fn.weeks = moment.fn.week;
  moment.fn.isoWeeks = moment.fn.isoWeek;
  // add aliased format methods
  moment.fn.toJSON = moment.fn.toISOString;
  /************************************
        Duration Prototype
    ************************************/
  extend(moment.duration.fn = Duration.prototype, {
    _bubble: function() {
      var milliseconds = this._milliseconds, days = this._days, months = this._months, data = this._data, seconds, minutes, hours, years;
      // The following code bubbles up values, see the tests for
      // examples of what that means.
      data.milliseconds = milliseconds % 1e3;
      seconds = absRound(milliseconds / 1e3);
      data.seconds = seconds % 60;
      minutes = absRound(seconds / 60);
      data.minutes = minutes % 60;
      hours = absRound(minutes / 60);
      data.hours = hours % 24;
      days += absRound(hours / 24);
      data.days = days % 30;
      months += absRound(days / 30);
      data.months = months % 12;
      years = absRound(months / 12);
      data.years = years;
    },
    weeks: function() {
      return absRound(this.days() / 7);
    },
    valueOf: function() {
      return this._milliseconds + this._days * 864e5 + this._months % 12 * 2592e6 + toInt(this._months / 12) * 31536e6;
    },
    humanize: function(withSuffix) {
      var difference = +this, output = relativeTime(difference, !withSuffix, this.lang());
      if (withSuffix) {
        output = this.lang().pastFuture(difference, output);
      }
      return this.lang().postformat(output);
    },
    add: function(input, val) {
      // supports only 2.0-style add(1, 's') or add(moment)
      var dur = moment.duration(input, val);
      this._milliseconds += dur._milliseconds;
      this._days += dur._days;
      this._months += dur._months;
      this._bubble();
      return this;
    },
    subtract: function(input, val) {
      var dur = moment.duration(input, val);
      this._milliseconds -= dur._milliseconds;
      this._days -= dur._days;
      this._months -= dur._months;
      this._bubble();
      return this;
    },
    get: function(units) {
      units = normalizeUnits(units);
      return this[units.toLowerCase() + "s"]();
    },
    as: function(units) {
      units = normalizeUnits(units);
      return this["as" + units.charAt(0).toUpperCase() + units.slice(1) + "s"]();
    },
    lang: moment.fn.lang,
    toIsoString: function() {
      // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
      var years = Math.abs(this.years()), months = Math.abs(this.months()), days = Math.abs(this.days()), hours = Math.abs(this.hours()), minutes = Math.abs(this.minutes()), seconds = Math.abs(this.seconds() + this.milliseconds() / 1e3);
      if (!this.asSeconds()) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return "P0D";
      }
      return (this.asSeconds() < 0 ? "-" : "") + "P" + (years ? years + "Y" : "") + (months ? months + "M" : "") + (days ? days + "D" : "") + (hours || minutes || seconds ? "T" : "") + (hours ? hours + "H" : "") + (minutes ? minutes + "M" : "") + (seconds ? seconds + "S" : "");
    }
  });
  function makeDurationGetter(name) {
    moment.duration.fn[name] = function() {
      return this._data[name];
    };
  }
  function makeDurationAsGetter(name, factor) {
    moment.duration.fn["as" + name] = function() {
      return +this / factor;
    };
  }
  for (i in unitMillisecondFactors) {
    if (unitMillisecondFactors.hasOwnProperty(i)) {
      makeDurationAsGetter(i, unitMillisecondFactors[i]);
      makeDurationGetter(i.toLowerCase());
    }
  }
  makeDurationAsGetter("Weeks", 6048e5);
  moment.duration.fn.asMonths = function() {
    return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
  };
  /************************************
        Default Lang
    ************************************/
  // Set default language, other languages will inherit from English.
  moment.lang("en", {
    ordinal: function(number) {
      var b = number % 10, output = toInt(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
      return number + output;
    }
  });
  /* EMBED_LANGUAGES */
  /************************************
        Exposing Moment
    ************************************/
  function makeGlobal(deprecate) {
    var warned = false, local_moment = moment;
    /*global ender:false */
    if (typeof ender !== "undefined") {
      return;
    }
    // here, `this` means `window` in the browser, or `global` on the server
    // add `moment` as a global object via a string identifier,
    // for Closure Compiler "advanced" mode
    if (deprecate) {
      this.moment = function() {
        if (!warned && console && console.warn) {
          warned = true;
          console.warn("Accessing Moment through the global scope is " + "deprecated, and will be removed in an upcoming " + "release.");
        }
        return local_moment.apply(null, arguments);
      };
    } else {
      this["moment"] = moment;
    }
  }
  // CommonJS module is defined
  if (hasModule) {
    module.exports = moment;
    makeGlobal(true);
  } else if (typeof define === "function" && define.amd) {
    define("moment", function(require, exports, module) {
      if (module.config().noGlobal !== true) {
        // If user provided noGlobal, he is aware of global
        makeGlobal(module.config().noGlobal === undefined);
      }
      return moment;
    });
  } else {
    makeGlobal();
  }
}).call(this);