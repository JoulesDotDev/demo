//__HEAD__
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// node_modules/imba/src/imba/utils.imba
function iter$__(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var $23 = Symbol.for("#__initor__");
var $24 = Symbol.for("#__inited__");
var $1 = Symbol.for("#__hooks__");
var $2 = Symbol.for("#type");
var $21 = Symbol.for("#__listeners__");
function deserializeData(data, reviver = null) {
  let objects = {};
  let reg = /\$\$\d+\$\$/;
  let lookup = function(value) {
    return objects[value] || (objects[value] = reviver ? reviver(value) : {});
  };
  let parser = function(key, value) {
    if (typeof value == "string") {
      if (value[0] == "$" && reg.test(value)) {
        return lookup(value);
      }
      ;
    } else if (typeof key == "string" && key[0] == "$" && reg.test(key)) {
      let obj = lookup(key);
      Object.assign(obj, value);
      return obj;
    }
    ;
    return value;
  };
  let parsed = JSON.parse(data, parser);
  return parsed;
}
function patchManifest(prev, curr) {
  var $83, $72, $124, $19;
  let origs = {};
  let diff = {
    added: [],
    changed: [],
    removed: [],
    all: [],
    urls: {}
  };
  if (prev.assets) {
    for (let $54 = 0, $64 = iter$__(prev.assets), $92 = $64.length; $54 < $92; $54++) {
      let item = $64[$54];
      let ref = item.originalPath || item.path;
      origs[ref] = item;
      if (item.url) {
        ($83 = curr.urls)[$72 = item.url] || ($83[$72] = item);
      }
      ;
    }
    ;
  }
  ;
  for (let $102 = 0, $112 = iter$__(curr.assets || []), $132 = $112.length; $102 < $132; $102++) {
    let item = $112[$102];
    let ref = item.originalPath || item.path;
    let orig = origs[ref];
    if (item.url && prev.urls) {
      prev.urls[item.url] = item;
    }
    ;
    if (orig) {
      if (orig.hash != item.hash) {
        orig.invalidated = Date.now();
        orig.replacedBy = item;
        item.replaces = orig;
        diff.changed.push(item);
        diff.all.push(item);
        if (orig == prev.main) {
          diff.main = item;
        }
        ;
      }
      ;
      $124 = origs[ref], delete origs[ref], $124;
    } else {
      diff.added.push(item);
      diff.all.push(item);
    }
    ;
  }
  ;
  for (let $142 = 0, $152 = Object.keys(origs), $162 = $152.length, path, item; $142 < $162; $142++) {
    path = $152[$142];
    item = origs[path];
    item.removed = Date.now();
    diff.all.push(item);
  }
  ;
  for (let $17 = 0, $18 = iter$__(diff.all), $202 = $18.length; $17 < $202; $17++) {
    let item = $18[$17];
    let typ = diff[$19 = item.type] || (diff[$19] = []);
    typ.push(item);
  }
  ;
  diff.removed = Object.values(origs);
  curr.changes = diff;
  return curr;
}

// node_modules/imba/src/imba/manifest.imba
var import_events = __toModule(require("events"));
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var $5 = Symbol.for("#__initor__");
var $6 = Symbol.for("#__inited__");
var $12 = Symbol.for("#__hooks__");
var $22 = Symbol.for("#refresh");
var $4 = Symbol.for("#__init__");
var $7 = Symbol.for("#manifest");
var $8 = Symbol.for("#absPath");
var $9 = Symbol.for("#raw");
var $10 = Symbol.for("#watch");
var $3 = Symbol();
var Asset = class {
  constructor(manifest2) {
    this[$7] = manifest2;
  }
  get absPath() {
    return this[$8] || (this[$8] = this[$7].resolve(this));
  }
  get name() {
    return import_path.default.basename(this.path);
  }
  get body() {
    return this.readSync();
  }
  readSync() {
    return import_fs.default.readFileSync(this.absPath, "utf-8");
  }
  pipe(res) {
    let stream = import_fs.default.createReadStream(this.absPath);
    return stream.pipe(res);
  }
  toString() {
    return this.url || this.absPath;
  }
};
var Manifest = class extends import_events.EventEmitter {
  static [$4]() {
    this.prototype[$5] = $3;
    return this;
  }
  constructor(options = {}) {
    var self;
    super();
    self = this;
    this.options = options;
    this.data = {};
    this.path = options.path;
    this.refs = {};
    self.reviver = function(key) {
      return new Asset(self);
    };
    self.init(options.data);
    this[$5] === $3 && (this[$12] && this[$12].inited(this), this[$6] && this[$6]());
  }
  get srcdir() {
    return import_path.default.resolve(import_path.default.dirname(this.path), this.data.srcdir);
  }
  get outdir() {
    return import_path.default.resolve(import_path.default.dirname(this.path), this.data.outdir);
  }
  get changes() {
    return this.data.changes || {};
  }
  get inputs() {
    return this.data.inputs;
  }
  get outputs() {
    return this.data.outputs;
  }
  get assets() {
    return this.data.assets;
  }
  get urls() {
    return this.data.urls || {};
  }
  get main() {
    return this.data.main;
  }
  get cwd() {
    return process.cwd();
  }
  get raw() {
    return this.data[$9];
  }
  resolve(path) {
    if (path._ == "input") {
      return import_path.default.resolve(this.srcdir || this.cwd, path.path);
    } else if (path._ == "output") {
      return import_path.default.resolve(this.outdir, path.path);
    } else {
      return import_path.default.resolve(this.cwd, path.path || path);
    }
    ;
  }
  resolveAssetPath(path) {
    return import_path.default.resolve(this.outdir, path);
  }
  read(path) {
    return import_fs.default.readFileSync(this.resolve(path), "utf-8");
  }
  loadFromFile(path) {
    return import_fs.default.existsSync(path) ? import_fs.default.readFileSync(path, "utf-8") : "{}";
  }
  init(data = null) {
    if (data || this.path) {
      this.update(data);
    }
    ;
    return this;
  }
  update(raw) {
    if (raw == null) {
      if (this.path) {
        raw = this.loadFromFile(this.path);
      } else {
        console.warn("cannot update manifest without path");
      }
      ;
    }
    ;
    if (typeof raw == "string") {
      let str = raw;
      raw = deserializeData(raw, this.reviver);
      raw[$9] = str;
    }
    ;
    this.data = patchManifest(this.data || {}, raw);
    if (this.data.changes.all.length) {
      this.emit("change", this.diff, this);
    }
    ;
    if (this.data.changes.main) {
      this.emit("change:main", this.data.main, this);
    }
    ;
    return this.data.changes;
  }
  serializeForBrowser() {
    return this.data[$9];
  }
  [$22](data) {
    return true;
  }
  watch() {
    var self = this;
    if (this[$10] != true ? (this[$10] = true, true) : false) {
      return self.path && !process.env.IMBA_HMR && import_fs.default.watch(this.path, function(ev, name) {
        let exists = import_fs.default.existsSync(self.path);
        let stat = exists && import_fs.default.statSync(self.path);
        if (exists) {
          self.update();
        }
        ;
        return;
      });
    }
    ;
  }
  on(event, cb) {
    this.watch();
    return super.on(...arguments);
  }
};
Manifest[$4]();
var LazyProxy = class {
  static for(getter) {
    return new Proxy({}, new this(getter));
  }
  constructor(getter) {
    this.getter = getter;
  }
  get target() {
    return this.getter();
  }
  get(_, key) {
    return this.target[key];
  }
  set(_, key, value) {
    this.target[key] = value;
    return true;
  }
};
var manifest = LazyProxy.for(function() {
  return globalThis[$7];
});

// node_modules/imba/src/imba/process.imba
var import_cluster = __toModule(require("cluster"));
var import_fs2 = __toModule(require("fs"));
var import_path2 = __toModule(require("path"));
var import_events2 = __toModule(require("events"));

// node_modules/imba/src/utils/logger.imba
var import_perf_hooks = __toModule(require("perf_hooks"));
var $13 = Symbol.for("#spinner");
var $52 = Symbol.for("#__initor__");
var $62 = Symbol.for("#__inited__");
var $25 = Symbol.for("#__hooks__");
var $32 = Symbol.for("#ctime");
var $42 = Symbol.for("#IMBA_OPTIONS");
var ansiMap = {
  reset: [0, 0],
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  redBright: [91, 39],
  greenBright: [92, 39],
  yellowBright: [93, 39],
  blueBright: [94, 39],
  magentaBright: [95, 39],
  cyanBright: [96, 39],
  whiteBright: [97, 39]
};
var ansi = {
  bold: function(text) {
    return "[1m" + text + "[22m";
  },
  red: function(text) {
    return "[31m" + text + "[39m";
  },
  green: function(text) {
    return "[32m" + text + "[39m";
  },
  yellow: function(text) {
    return "[33m" + text + "[39m";
  },
  blue: function(text) {
    return "[94m" + text + "[39m";
  },
  gray: function(text) {
    return "[90m" + text + "[39m";
  },
  white: function(text) {
    return "[37m" + text + "[39m";
  },
  f: function(name, text) {
    let pair = ansiMap[name];
    return "[" + pair[0] + "m" + text + "[" + pair[1] + "m";
  }
};
ansi.warn = ansi.yellow;
ansi.error = ansi.red;
var notWin = process.platform !== "win32" || process.env.CI || process.env.TERM === "xterm-256color";
var logSymbols = {
  info: ansi.f("yellowBright", notWin ? "\u2139" : "i"),
  success: ansi.green(notWin ? "\u2714" : "\u221A"),
  warning: ansi.yellow(notWin ? "\u26A0" : "!!"),
  error: ansi.red(notWin ? "\xD7" : "\u2716"),
  debug: ansi.blue(notWin ? "\u2139" : "i")
};
var logLevels = ["debug", "info", "success", "warning", "error", "silent"];
var addressTypeName = {
  "-1": "socket",
  "4": "ip4",
  "6": "ip6"
};
function formatMarkdown(str) {
  let fmt = ansi.f;
  str = str.replace(/https?\:[^\s\n\)\]]+/g, function(m) {
    return fmt("blueBright", m);
  });
  str = str.replace(/^[\t\s]*\>[^\n]+/gm, function(m) {
    return fmt("bold", m);
  });
  str = str.replace(/\t/g, "  ");
  str = str.replace(/^/gm, "  ");
  return str;
}
function format(str, ...rest) {
  let fmt = ansi.f;
  str = str.replace(/\%([\w\.]+)/g, function(m, f) {
    let part = rest.shift();
    if (f == "markdown") {
      return formatMarkdown(part);
    } else if (f == "kb") {
      return fmt("dim", (part / 1e3).toFixed(1) + "kb");
    } else if (f == "path" || f == "bold") {
      return fmt("bold", part);
    } else if (f == "dim") {
      return fmt("dim", part);
    } else if (f == "address") {
      let typ = addressTypeName[part.addressType];
      if (part.port) {
        return fmt("blueBright", [part.address || "http://127.0.0.1", part.port].join(":"));
      } else {
        return fmt("blueBright", typ);
      }
      ;
    } else if (f == "ms") {
      return fmt("yellow", Math.round(part) + "ms");
    } else if (f == "d") {
      return fmt("blueBright", part);
    } else if (f == "red") {
      return fmt("redBright", part);
    } else if (f == "green") {
      return fmt("greenBright", part);
    } else if (f == "yellow") {
      return fmt("yellowBright", part);
    } else if (f == "ref") {
      return fmt("yellowBright", "#" + (part.id || part));
    } else if (f == "elapsed") {
      if (part != void 0) {
        rest.unshift(part);
      }
      ;
      let elapsed = import_perf_hooks.performance.now();
      return fmt("yellow", Math.round(elapsed) + "ms");
    } else if (f == "heap") {
      if (part != void 0) {
        rest.unshift(part);
      }
      ;
      let used = process.memoryUsage().heapUsed / 1024 / 1024;
      return fmt("yellow", used.toFixed(2) + "mb");
    } else {
      return part;
    }
    ;
  });
  return [str, ...rest];
}
var Spinner = null;
var Instance = null;
var Logger = class {
  static get main() {
    return Instance || (Instance = new this());
  }
  constructor({prefix = null, loglevel} = {}) {
    this[$32] = Date.now();
    this.prefix = prefix ? format(...prefix)[0] : "";
    this.loglevel = loglevel || process.env.IMBA_LOGLEVEL || globalThis[$42] && globalThis[$42].loglevel || "info";
  }
  write(kind, ...parts) {
    if (logLevels.indexOf(kind) < logLevels.indexOf(this.loglevel)) {
      return this;
    }
    ;
    let sym = logSymbols[kind] || kind;
    let [str, ...rest] = format(...parts);
    if (this.prefix) {
      str = this.prefix + str;
    }
    ;
    if (this[$13] && this[$13].isSpinning) {
      if (kind == "success") {
        this[$13].clear();
        console.log(sym + " " + str, ...rest);
        this[$13].frame();
      }
      ;
      return this[$13].text = str;
    } else {
      return console.log(sym + " " + str, ...rest);
    }
    ;
  }
  debug(...pars) {
    return this.write("debug", ...pars);
  }
  log(...pars) {
    return this.write("info", ...pars);
  }
  info(...pars) {
    return this.write("info", ...pars);
  }
  warn(...pars) {
    return this.write("warn", ...pars);
  }
  error(...pars) {
    return this.write("error", ...pars);
  }
  success(...pars) {
    return this.write("success", ...pars);
  }
  ts(...pars) {
    return this.write("debug", ...pars, import_perf_hooks.performance.now());
  }
  spinner() {
    return;
    return Spinner = this.ora("Loading").start();
  }
  get [$13]() {
    return Spinner;
  }
  get proxy() {
    var self = this;
    let fn = function(...pars) {
      return self.info(...pars);
    };
    fn.info = self.info.bind(self);
    fn.warn = self.warn.bind(self);
    fn.error = self.error.bind(self);
    fn.debug = self.debug.bind(self);
    fn.success = self.success.bind(self);
    fn.ts = self.ts.bind(self);
    fn.logger = self;
    return fn;
  }
  async time(label, cb) {
    let t = Date.now();
    if (cb) {
      let res = await cb();
      this.info("" + label + " %ms", Date.now() - t);
      return res;
    }
    ;
  }
};
var logger_default = new Logger().proxy;

// node_modules/imba/src/imba/process.imba
var import_module = __toModule(require("module"));
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_http2 = __toModule(require("http2"));
function iter$__2(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var $14 = Symbol.for("#setup");
var $53 = Symbol.for("#__initor__");
var $63 = Symbol.for("#__inited__");
var $26 = Symbol.for("#__hooks__");
var $43 = Symbol.for("#__init__");
var $122 = Symbol.for("#setup?");
var $15 = Symbol.for("#watch");
var $20 = Symbol.for("#dom");
var $212 = Symbol.for("#server");
var $222 = Symbol.for("#raw");
var $33 = Symbol();
var defaultHeaders = {
  html: {"Content-Type": "text/html"},
  js: {"Content-Type": "text/javascript"},
  mjs: {"Content-Type": "text/javascript"},
  json: {"Content-Type": "application/json"},
  css: {"Content-Type": "text/css"},
  otf: {"Content-Type": "font/otf"},
  ttf: {"Content-Type": "font/ttf"},
  woff: {"Content-Type": "font/woff"},
  woff2: {"Content-Type": "font/woff2"},
  svg: {"Content-Type": "image/svg+xml"},
  avif: {"Content-Type": "image/avif"},
  gif: {"Content-Type": "image/gif"},
  png: {"Content-Type": "image/png"},
  apng: {"Content-Type": "image/apng"},
  webp: {"Content-Type": "image/webp"},
  jpg: {"Content-Type": "image/jpeg"},
  jpeg: {"Content-Type": "image/jpeg"},
  bmp: {"Content-Type": "image/bmp"},
  webm: {"Content-Type": "video/webm"},
  weba: {"Content-Type": "audio/webm"},
  avi: {"Content-Type": "video/x-msvideo"},
  mp3: {"Content-Type": "audio/mpeg"},
  mp4: {"Content-Type": "video/mp4"},
  m4a: {"Content-Type": "audio/m4a"},
  mpeg: {"Content-Type": "video/mpeg"},
  wav: {"Content-Type": "audio/wav"},
  ogg: {"Content-Type": "audio/ogg"},
  ogv: {"Content-Type": "video/ogg"},
  oga: {"Content-Type": "audio/ogg"},
  opus: {"Content-Type": "audio/opus"}
};
var proc = globalThis.process;
var Servers = class extends Set {
  call(name, ...params) {
    var $72;
    $72 = [];
    for (let server of iter$__2(this)) {
      $72.push(server[name](...params));
    }
    ;
    return $72;
  }
  close(o = {}) {
    var $83;
    $83 = [];
    for (let server of iter$__2(this)) {
      $83.push(server.close(o));
    }
    ;
    return $83;
  }
  reload(o = {}) {
    var $92;
    $92 = [];
    for (let server of iter$__2(this)) {
      $92.push(server.reload(o));
    }
    ;
    return $92;
  }
  broadcast(msg, ...rest) {
    var $102;
    $102 = [];
    for (let server of iter$__2(this)) {
      $102.push(server.broadcast(msg, ...rest));
    }
    ;
    return $102;
  }
  emit(event, data) {
    var $112;
    $112 = [];
    for (let server of iter$__2(this)) {
      $112.push(server.emit(event, data));
    }
    ;
    return $112;
  }
};
var servers = new Servers();
var process2 = new (class Process extends import_events2.EventEmitter {
  static [$43]() {
    this.prototype[$53] = $33;
    return this;
  }
  constructor() {
    var self;
    super(...arguments);
    self = this;
    this.autoreload = false;
    this.state = {};
    if (import_cluster.default.isWorker) {
      proc.on("message", function(msg) {
        self.emit("message", msg);
        if (msg[0] == "emit") {
          return self.emit(...msg.slice(1));
        }
        ;
      });
    }
    ;
    self;
    this[$53] === $33 && (this[$26] && this[$26].inited(this), this[$63] && this[$63]());
  }
  [$14]() {
    var self = this;
    if (!(this[$122] != true ? (this[$122] = true, true) : false)) {
      return;
    }
    ;
    self.on("reloading", function(e) {
      var $132;
      console.log("is reloading - from outside");
      self.state.reloading = true;
      $132 = [];
      for (let server of iter$__2(servers)) {
        $132.push(server.pause());
      }
      ;
      return $132;
    });
    self.on("reloaded", async function(e) {
      var $142;
      self.state.reloaded = true;
      console.log("is reloaded - from outside");
      $142 = [];
      for (let server of iter$__2(servers)) {
        $142.push(server.close());
      }
      ;
      let promises = $142;
      await Promise.all(promises);
      return proc.exit(0);
    });
    self.on("manifest:change", function(e) {
      if (proc.env.IMBA_HMR) {
        return manifest.update(e);
      }
      ;
    });
    self.on("manifest:error", function(e) {
      if (proc.env.IMBA_HMR) {
        manifest.errors = e;
        return servers.broadcast("errors", manifest.errors);
      }
      ;
    });
    return true;
  }
  send(msg) {
    if (proc.send instanceof Function) {
      return proc.send(msg);
    }
    ;
  }
  on(name, cb) {
    if (name == "change") {
      this.watch();
    }
    ;
    return super.on(...arguments);
  }
  watch() {
    var self = this;
    if (this[$15] != true ? (this[$15] = true, true) : false) {
      return manifest.on("change:main", function() {
        return self.emit("change", manifest);
      });
    }
    ;
  }
  reload() {
    if (!(this.isReloading != true ? (this.isReloading = true, true) : false)) {
      return this;
    }
    ;
    this.state.reloading = true;
    if (!proc.env.IMBA_SERVE) {
      console.warn("not possible to gracefully reload servers not started via imba start");
      return;
    }
    ;
    this.send("reload");
    return;
    for (let server of iter$__2(servers)) {
      server.pause();
    }
    ;
    this.on("reloaded", async function(e) {
      var $162;
      $162 = [];
      for (let server of iter$__2(servers)) {
        $162.push(server.close());
      }
      ;
      let promises = $162;
      await Promise.all(promises);
      return proc.exit(0);
    });
    return this.send("reload");
  }
}[$43]())();
var AssetResponder = class {
  constructor(url, params = {}) {
    this.url = url;
    [this.path, this.query] = url.split("?");
    this.ext = import_path2.default.extname(this.path);
    this.headers = {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "cache-control": "public"
    };
    Object.assign(this.headers, defaultHeaders[this.ext.slice(1)] || {});
  }
  respond(req, res) {
    let asset2 = manifest.urls[this.url];
    let headers = this.headers;
    let path = asset2 ? manifest.resolve(asset2) : manifest.resolveAssetPath("public" + this.path);
    if (!path) {
      console.log("found no path for", asset2, this.url);
      res.writeHead(404, {});
      return res.end();
    }
    ;
    if (asset2) {
      if (asset2.ttl > 0) {
        headers["cache-control"] = "max-age=" + asset2.ttl;
      }
      ;
      if (asset2.imports) {
        let link = [];
        for (let $17 = 0, $18 = iter$__2(asset2.imports), $19 = $18.length; $17 < $19; $17++) {
          let item = $18[$17];
          link.push("<" + item.url + ">; rel=modulepreload; as=script");
        }
        ;
        headers.Link = link.join(", ");
      }
      ;
    }
    ;
    return import_fs2.default.access(path, import_fs2.default.constants.R_OK, function(err) {
      if (err) {
        console.log("could not find path", path);
        res.writeHead(404, {});
        return res.end();
      }
      ;
      try {
        let stream = import_fs2.default.createReadStream(path);
        res.writeHead(200, headers);
        return stream.pipe(res);
      } catch (e) {
        res.writeHead(503, {});
        return res.end();
      }
      ;
    });
  }
  createReadStream() {
    return import_fs2.default.createReadStream(this.path);
  }
  pipe(response) {
    return this.createReadStream().pipe(response);
  }
};
var Server = class {
  static wrap(server, o = {}) {
    return new this(server, o);
  }
  constructor(srv, options) {
    var self = this;
    servers.add(this);
    this.id = Math.random();
    this.options = options;
    this.closed = false;
    this.paused = false;
    this.server = srv;
    this.clients = new Set();
    this.stalledResponses = [];
    this.assetResponders = {};
    if (proc.env.IMBA_PATH) {
      this.devtoolsPath = import_path2.default.resolve(proc.env.IMBA_PATH, "dist", "hmr.js");
    }
    ;
    this.scheme = srv instanceof import_http.default.Server ? "http" : "https";
    let originalHandler = this.server._events.request;
    let dom = globalThis[$20];
    srv.off("request", originalHandler);
    originalHandler[$212] = this;
    srv.on("listening", function() {
      let adr = self.server.address();
      let host = adr.address;
      if (host == "::" || host == "0.0.0.0") {
        host = "localhost";
      }
      ;
      let url = "" + self.scheme + "://" + host + ":" + adr.port + "/";
      return logger_default.info("listening on %bold", url);
    });
    manifest.on("change", function(changes, m) {
      return self.broadcast("manifest", m.data[$222]);
    });
    self.handler = function(req, res) {
      var $232;
      let ishttp2 = req instanceof import_http2.Http2ServerRequest;
      let url = req.url;
      let assetPrefix = "/__assets__/";
      if (self.paused || self.closed) {
        res.statusCode = 302;
        res.setHeader("Location", req.url);
        if (!ishttp2) {
          res.setHeader("Connection", "close");
        }
        ;
        if (self.closed) {
          if (ishttp2) {
            req.stream.session.close();
          }
          ;
          return res.end();
        } else {
          return self.stalledResponses.push(res);
        }
        ;
      }
      ;
      if (url == "/__hmr__.js" && self.devtoolsPath) {
        let stream = import_fs2.default.createReadStream(self.devtoolsPath);
        res.writeHead(200, defaultHeaders.js);
        return stream.pipe(res);
      }
      ;
      if (url == "/__hmr__") {
        let headers2 = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache"
        };
        if (!ishttp2) {
          headers2.Connection = "keep-alive";
        }
        ;
        res.writeHead(200, headers2);
        self.clients.add(res);
        self.broadcast("init", manifest.serializeForBrowser(), [res]);
        req.on("close", function() {
          return self.clients.delete(res);
        });
        return true;
      }
      ;
      if (url.indexOf(assetPrefix) == 0 || manifest.urls[url]) {
        let responder = ($232 = self.assetResponders)[url] || ($232[url] = new AssetResponder(url, self));
        return responder.respond(req, res);
      }
      ;
      let headers = req.headers;
      let base;
      if (ishttp2) {
        base = headers[":scheme"] + "://" + headers[":authority"];
      } else {
        let scheme = req.connection.encrypted ? "https" : "http";
        base = scheme + "://" + headers.host;
      }
      ;
      if (options.static) {
        let rurl = new URL(url, base);
        let ext = import_path2.default.extname(rurl.pathname);
        let headers2 = defaultHeaders[ext.slice(1)];
        if (headers2) {
          let path = import_path2.default.resolve(manifest.cwd, "." + rurl.pathname);
          let exists = import_fs2.default.existsSync(path);
          if (exists) {
            import_fs2.default.readFile(path, function(err, data) {
              if (err) {
                res.writeHead(500, {});
                return res.write("Error getting the file: " + err);
              } else {
                res.writeHead(200, headers2);
                return res.end(data);
              }
              ;
            });
            return;
          }
          ;
        }
        ;
      }
      ;
      if (dom) {
        let loc = new dom.Location(req.url, base);
        return dom.Document.create({location: loc}, function() {
          return originalHandler(req, res);
        });
      } else {
        return originalHandler(req, res);
      }
      ;
    };
    srv.on("request", self.handler);
    srv.on("close", function() {
      return console.log("server is closing!!!");
    });
    if (import_cluster.default.isWorker) {
      process2[$14]();
      process2.send("serve");
    }
    ;
  }
  broadcast(event, data = {}, clients = this.clients) {
    data = JSON.stringify(data);
    let msg = "data: " + data + "\n\n\n";
    for (let client of iter$__2(clients)) {
      client.write("event: " + event + "\n");
      client.write("id: imba\n");
      client.write(msg);
    }
    ;
    return this;
  }
  pause() {
    if (this.paused != true ? (this.paused = true, true) : false) {
      this.broadcast("paused");
    }
    ;
    return this;
  }
  resume() {
    if (this.paused != false ? (this.paused = false, true) : false) {
      this.broadcast("resumed");
      return this.flushStalledResponses();
    }
    ;
  }
  flushStalledResponses() {
    for (let $242 = 0, $252 = iter$__2(this.stalledResponses), $262 = $252.length; $242 < $262; $242++) {
      let res = $252[$242];
      res.end();
    }
    ;
    return this.stalledResponses = [];
  }
  close() {
    var self = this;
    this.pause();
    return new Promise(function(resolve) {
      self.closed = true;
      self.server.close(resolve);
      return self.flushStalledResponses();
    });
  }
};
function serve(srv, ...params) {
  return Server.wrap(srv, ...params);
}

// node_modules/imba/src/imba/asset.imba
var $11 = Symbol.for("#__initor__");
var $123 = Symbol.for("#__inited__");
var $16 = Symbol.for("#__hooks__");
var $27 = Symbol.for("#__init__");
var $34 = Symbol.for("#warned");
var $82 = Symbol.for("#asset");
var AssetProxy = class {
  static wrap(meta) {
    let handler = new AssetProxy(meta);
    return new Proxy(handler, handler);
  }
  constructor(meta) {
    this.meta = meta;
  }
  get input() {
    return manifest.inputs[this.meta.input];
  }
  get asset() {
    return globalThis._MF_ ? this.meta : this.input ? this.input.asset : null;
  }
  set(target, key, value) {
    return true;
  }
  get(target, key) {
    if (this.meta.meta && this.meta.meta[key] != void 0) {
      return this.meta.meta[key];
    }
    ;
    if (!this.asset) {
      if (this.meta[$34] != true ? (this.meta[$34] = true, true) : false) {
        console.warn("Asset for '" + this.meta.input + "' not found");
      }
      ;
      if (key == "valueOf") {
        return function() {
          return "";
        };
      }
      ;
      return null;
    }
    ;
    if (key == "absPath" && !this.asset.absPath) {
      return this.asset.url;
    }
    ;
    return this.asset[key];
  }
};
var SVGAsset = class {
  constructor($$ = null) {
    this[$27]($$);
  }
  [$27]($$ = null) {
    this.url = $$ ? $$.url : void 0;
    this.meta = $$ ? $$.meta : void 0;
  }
  adoptNode(node) {
    var _a;
    if ((_a = this.meta) == null ? void 0 : _a.content) {
      for (let $64 = this.meta.attributes, $44 = 0, $54 = Object.keys($64), $72 = $54.length, k, v; $44 < $72; $44++) {
        k = $54[$44];
        v = $64[k];
        node.setAttribute(k, v);
      }
      ;
      node.innerHTML = this.meta.content;
    }
    ;
    return this;
  }
  toString() {
    return this.url;
  }
  toStyleString() {
    return "url(" + this.url + ")";
  }
};
function asset(data) {
  var $92, $102;
  if (data[$82]) {
    return data[$82];
  }
  ;
  if (data.type == "svg") {
    return data[$82] || (data[$82] = new SVGAsset(data));
  }
  ;
  if (data.input) {
    let extra = globalThis._MF_ && globalThis._MF_[data.input];
    if (extra) {
      Object.assign(data, extra);
      data.toString = function() {
        return this.absPath;
      };
    }
    ;
    return data[$82] || (data[$82] = AssetProxy.wrap(data));
  }
  ;
  return data;
}

// server.imba
var import_express = __toModule(require("express"));

// entry:app/index.html
var app_default = asset({input: "entry:app/index.html"});

// server.imba
var app = (0, import_express.default)();
app.get(/.*/, function(req, res) {
  if (req.accepts(["image/*", "html"]) != "html") {
    return res.sendStatus(404);
  }
  ;
  return res.send(app_default.body);
});
serve(app.listen(process.env.PORT || 3e3));
//__FOOT__
