
// node_modules/imba/src/imba/utils.imba
var \u03A8__initor__ = Symbol.for("#__initor__");
var \u03A8__inited__ = Symbol.for("#__inited__");
var \u03A8type = Symbol.for("#type");
var \u03A8__listeners__ = Symbol.for("#__listeners__");
function parseTime(value) {
  let typ = typeof value;
  if (typ == "number") {
    return value;
  }
  ;
  if (typ == "string") {
    if (/^\d+fps$/.test(value)) {
      return 1e3 / parseFloat(value);
    } else if (/^([-+]?[\d\.]+)s$/.test(value)) {
      return parseFloat(value) * 1e3;
    } else if (/^([-+]?[\d\.]+)ms$/.test(value)) {
      return parseFloat(value);
    }
    ;
  }
  ;
  return null;
}
function getDeepPropertyDescriptor(item, key, stop) {
  if (!item) {
    return void 0;
  }
  ;
  let desc = Object.getOwnPropertyDescriptor(item, key);
  if (desc || item == stop) {
    return desc || void 0;
  }
  ;
  return getDeepPropertyDescriptor(Reflect.getPrototypeOf(item), key, stop);
}
var emit__ = function(event, args, node) {
  let prev;
  let cb;
  let ret;
  while ((prev = node) && (node = node.next)) {
    if (cb = node.listener) {
      if (node.path && cb[node.path]) {
        ret = args ? cb[node.path].apply(cb, args) : cb[node.path]();
      } else {
        ret = args ? cb.apply(node, args) : cb.call(node);
      }
      ;
    }
    ;
    if (node.times && --node.times <= 0) {
      prev.next = node.next;
      node.listener = null;
    }
    ;
  }
  ;
  return;
};
function listen(obj, event, listener, path) {
  var \u03C652;
  let cbs;
  let list;
  let tail;
  cbs = obj[\u03A8__listeners__] || (obj[\u03A8__listeners__] = {});
  list = cbs[event] || (cbs[event] = {});
  tail = list.tail || (list.tail = list.next = {});
  tail.listener = listener;
  tail.path = path;
  list.tail = tail.next = {};
  return tail;
}
function once(obj, event, listener) {
  let tail = listen(obj, event, listener);
  tail.times = 1;
  return tail;
}
function unlisten(obj, event, cb, meth) {
  let node;
  let prev;
  let meta = obj[\u03A8__listeners__];
  if (!meta) {
    return;
  }
  ;
  if (node = meta[event]) {
    while ((prev = node) && (node = node.next)) {
      if (node == cb || node.listener == cb) {
        prev.next = node.next;
        node.listener = null;
        break;
      }
      ;
    }
    ;
  }
  ;
  return;
}
function emit(obj, event, params) {
  let cb;
  if (cb = obj[\u03A8__listeners__]) {
    if (cb[event]) {
      emit__(event, params, cb[event]);
    }
    ;
    if (cb.all) {
      emit__(event, [event, params], cb.all);
    }
    ;
  }
  ;
  return;
}

// node_modules/imba/src/imba/scheduler.imba
function iter$__(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8__init__ = Symbol.for("#__init__");
var \u03A8__initor__2 = Symbol.for("#__initor__");
var \u03A8__inited__2 = Symbol.for("#__inited__");
var \u03A8schedule = Symbol.for("#schedule");
var \u03A8frames = Symbol.for("#frames");
var \u03A8interval = Symbol.for("#interval");
var \u03A8stage = Symbol.for("#stage");
var \u03A8scheduled = Symbol.for("#scheduled");
var \u03A8fps = Symbol.for("#fps");
var \u03A8ticker = Symbol.for("#ticker");
var rAF = globalThis.requestAnimationFrame || function(blk) {
  return setTimeout1(blk, 1e3 / 60);
};
var SPF = 1 / 60;
var Scheduled = class {
  constructor($$ = null) {
    this[\u03A8__init__]($$);
  }
  [\u03A8__init__]($$ = null) {
    var v\u03C6;
    this.owner = $$ && (v\u03C6 = $$.owner) !== void 0 ? v\u03C6 : null;
    this.target = $$ && (v\u03C6 = $$.target) !== void 0 ? v\u03C6 : null;
    this.active = $$ && (v\u03C6 = $$.active) !== void 0 ? v\u03C6 : false;
    this.value = $$ && (v\u03C6 = $$.value) !== void 0 ? v\u03C6 : void 0;
    this.skip = $$ && (v\u03C6 = $$.skip) !== void 0 ? v\u03C6 : 0;
    this.last = $$ && (v\u03C6 = $$.last) !== void 0 ? v\u03C6 : 0;
  }
  tick(scheduler2, source) {
    this.last = this.owner[\u03A8frames];
    this.target.tick(this, source);
    return 1;
  }
  update(o, activate\u03A6) {
    let on = this.active;
    let val = o.value;
    let changed = this.value != val;
    if (changed) {
      this.deactivate();
      this.value = val;
    }
    ;
    if (this.value || on || activate\u03A6) {
      this.activate();
    }
    ;
    return this;
  }
  queue() {
    this.owner.add(this);
    return;
  }
  activate() {
    if (this.value === true) {
      this.owner.on("commit", this);
    } else if (this.value === false) {
      true;
    } else if (typeof this.value == "number") {
      let tock = this.value / (1e3 / 60);
      if (tock <= 2) {
        this.owner.on("raf", this);
      } else {
        this[\u03A8interval] = globalThis.setInterval(this.queue.bind(this), this.value);
      }
      ;
    }
    ;
    this.active = true;
    return this;
  }
  deactivate() {
    if (this.value === true) {
      this.owner.un("commit", this);
    }
    ;
    this.owner.un("raf", this);
    if (this[\u03A8interval]) {
      globalThis.clearInterval(this[\u03A8interval]);
      this[\u03A8interval] = null;
    }
    ;
    this.active = false;
    return this;
  }
};
var Scheduler = class {
  constructor() {
    var self = this;
    this.id = Symbol();
    this.queue = [];
    this.stage = -1;
    this[\u03A8stage] = -1;
    this[\u03A8frames] = 0;
    this[\u03A8scheduled] = false;
    this.listeners = {};
    this.intervals = {};
    self.commit = function() {
      self.add("commit");
      return self;
    };
    this[\u03A8fps] = 0;
    self.$promise = null;
    self.$resolve = null;
    this[\u03A8ticker] = function(e) {
      self[\u03A8scheduled] = false;
      return self.tick(e);
    };
    self;
  }
  add(item, force) {
    if (force || this.queue.indexOf(item) == -1) {
      this.queue.push(item);
    }
    ;
    if (!this[\u03A8scheduled]) {
      this[\u03A8schedule]();
    }
    ;
    return this;
  }
  get committing\u03A6() {
    return this.queue.indexOf("commit") >= 0;
  }
  listen(ns, item) {
    let set = this.listeners[ns];
    let first = !set;
    set || (set = this.listeners[ns] = new Set());
    set.add(item);
    if (ns == "raf" && first) {
      this.add("raf");
    }
    ;
    return this;
  }
  unlisten(ns, item) {
    var \u03C66;
    let set = this.listeners[ns];
    set && set.delete(item);
    if (ns == "raf" && set && set.size == 0) {
      \u03C66 = this.listeners.raf, delete this.listeners.raf, \u03C66;
    }
    ;
    return this;
  }
  on(ns, item) {
    return this.listen(ns, item);
  }
  un(ns, item) {
    return this.unlisten(ns, item);
  }
  get promise() {
    var self = this;
    return self.$promise || (self.$promise = new Promise(function(resolve) {
      return self.$resolve = resolve;
    }));
  }
  tick(timestamp) {
    var self = this;
    let items = this.queue;
    let frame = this[\u03A8frames]++;
    if (!this.ts) {
      this.ts = timestamp;
    }
    ;
    this.dt = timestamp - this.ts;
    this.ts = timestamp;
    this.queue = [];
    this[\u03A8stage] = 1;
    if (items.length) {
      for (let i = 0, items\u03C6 = iter$__(items), len\u03C6 = items\u03C6.length; i < len\u03C6; i++) {
        let item = items\u03C6[i];
        if (typeof item === "string" && this.listeners[item]) {
          self.listeners[item].forEach(function(listener) {
            if (listener.tick instanceof Function) {
              return listener.tick(self, item);
            } else if (listener instanceof Function) {
              return listener(self, item);
            }
            ;
          });
        } else if (item instanceof Function) {
          item(self.dt, self);
        } else if (item.tick) {
          item.tick(self.dt, self);
        }
        ;
      }
      ;
    }
    ;
    this[\u03A8stage] = this[\u03A8scheduled] ? 0 : -1;
    if (self.$promise) {
      self.$resolve(self);
      self.$promise = self.$resolve = null;
    }
    ;
    if (self.listeners.raf && true) {
      self.add("raf");
    }
    ;
    return self;
  }
  [\u03A8schedule]() {
    if (!this[\u03A8scheduled]) {
      this[\u03A8scheduled] = true;
      if (this[\u03A8stage] == -1) {
        this[\u03A8stage] = 0;
      }
      ;
      rAF(this[\u03A8ticker]);
    }
    ;
    return this;
  }
  schedule(item, o) {
    var \u03C622, \u03C632;
    o || (o = item[\u03C622 = this.id] || (item[\u03C622] = {value: true}));
    let state2 = o[\u03C632 = this.id] || (o[\u03C632] = new Scheduled({owner: this, target: item}));
    return state2.update(o, true);
  }
  unschedule(item, o = {}) {
    o || (o = item[this.id]);
    let state2 = o && o[this.id];
    if (state2 && state2.active) {
      state2.deactivate();
    }
    ;
    return this;
  }
};
var scheduler = new Scheduler();
function commit() {
  return scheduler.add("commit").promise;
}
function setTimeout2(fn, ms) {
  return globalThis.setTimeout(function() {
    fn();
    commit();
    return;
  }, ms);
}
function setInterval2(fn, ms) {
  return globalThis.setInterval(function() {
    fn();
    commit();
    return;
  }, ms);
}
var clearInterval2 = globalThis.clearInterval;
var clearTimeout = globalThis.clearTimeout;
var instance = globalThis.imba || (globalThis.imba = {});
instance.commit = commit;
instance.setTimeout = setTimeout2;
instance.setInterval = setInterval2;
instance.clearInterval = clearInterval2;
instance.clearTimeout = clearTimeout;

// node_modules/imba/src/imba/dom/flags.imba
var \u03A8toStringDeopt = Symbol.for("#toStringDeopt");
var \u03A8__initor__3 = Symbol.for("#__initor__");
var \u03A8__inited__3 = Symbol.for("#__inited__");
var \u03A8symbols = Symbol.for("#symbols");
var \u03A8batches = Symbol.for("#batches");
var \u03A8extras = Symbol.for("#extras");
var \u03A8stacks = Symbol.for("#stacks");
var Flags = class {
  constructor(dom) {
    this.dom = dom;
    this.string = "";
  }
  contains(ref) {
    return this.dom.classList.contains(ref);
  }
  add(ref) {
    if (this.contains(ref)) {
      return this;
    }
    ;
    this.string += (this.string ? " " : "") + ref;
    this.dom.classList.add(ref);
    return this;
  }
  remove(ref) {
    if (!this.contains(ref)) {
      return this;
    }
    ;
    let regex = new RegExp("(^|\\s)" + ref + "(?=\\s|$)", "g");
    this.string = this.string.replace(regex, "");
    this.dom.classList.remove(ref);
    return this;
  }
  toggle(ref, bool) {
    if (bool === void 0) {
      bool = !this.contains(ref);
    }
    ;
    return bool ? this.add(ref) : this.remove(ref);
  }
  incr(ref, duration = 0) {
    var self = this;
    let m = this.stacks;
    let c = m[ref] || 0;
    if (c < 1) {
      this.add(ref);
    }
    ;
    if (duration > 0) {
      setTimeout(function() {
        return self.decr(ref);
      }, duration);
    }
    ;
    return m[ref] = Math.max(c, 0) + 1;
  }
  decr(ref) {
    let m = this.stacks;
    let c = m[ref] || 0;
    if (c == 1) {
      this.remove(ref);
    }
    ;
    return m[ref] = Math.max(c, 1) - 1;
  }
  reconcile(sym, str) {
    let syms = this[\u03A8symbols];
    let vals = this[\u03A8batches];
    let dirty = true;
    if (!syms) {
      syms = this[\u03A8symbols] = [sym];
      vals = this[\u03A8batches] = [str || ""];
      this.toString = this.valueOf = this[\u03A8toStringDeopt];
    } else {
      let idx = syms.indexOf(sym);
      let val = str || "";
      if (idx == -1) {
        syms.push(sym);
        vals.push(val);
      } else if (vals[idx] != val) {
        vals[idx] = val;
      } else {
        dirty = false;
      }
      ;
    }
    ;
    if (dirty) {
      this[\u03A8extras] = " " + vals.join(" ");
      this.sync();
    }
    ;
    return;
  }
  valueOf() {
    return this.string;
  }
  toString() {
    return this.string;
  }
  [\u03A8toStringDeopt]() {
    return this.string + (this[\u03A8extras] || "");
  }
  sync() {
    return this.dom.flagSync$();
  }
  get stacks() {
    return this[\u03A8stacks] || (this[\u03A8stacks] = {});
  }
};

// node_modules/imba/src/imba/dom/context.imba
var \u03A8__init__2 = Symbol.for("#__init__");
var \u03A8__initor__4 = Symbol.for("#__initor__");
var \u03A8__inited__4 = Symbol.for("#__inited__");
var \u03A8getRenderContext = Symbol.for("#getRenderContext");
var \u03A8getDynamicContext = Symbol.for("#getDynamicContext");
var \u03C6 = Symbol();
var renderContext = {
  context: null
};
var Renderer = class {
  constructor($$ = null) {
    this[\u03A8__init__2]($$);
  }
  [\u03A8__init__2]($$ = null) {
    var v\u03C6;
    this.stack = $$ && (v\u03C6 = $$.stack) !== void 0 ? v\u03C6 : [];
  }
  push(el) {
    return this.stack.push(el);
  }
  pop(el) {
    return this.stack.pop();
  }
};
var renderer = new Renderer();
var RenderContext = class extends Map {
  static [\u03A8__init__2]() {
    this.prototype[\u03A8__initor__4] = \u03C6;
    return this;
  }
  constructor(parent, sym = null) {
    super();
    this._ = parent;
    this.sym = sym;
    this[\u03A8__initor__4] === \u03C6 && this[\u03A8__inited__4] && this[\u03A8__inited__4]();
  }
  pop() {
    return renderContext.context = null;
  }
  [\u03A8getRenderContext](sym) {
    let out = this.get(sym);
    out || this.set(sym, out = new RenderContext(this._, sym));
    return renderContext.context = out;
  }
  [\u03A8getDynamicContext](sym, key) {
    return this[\u03A8getRenderContext](sym)[\u03A8getRenderContext](key);
  }
  run(value) {
    this.value = value;
    if (renderContext.context == this) {
      renderContext.context = null;
    }
    ;
    return this.get(value);
  }
  cache(val) {
    this.set(this.value, val);
    return val;
  }
};
RenderContext[\u03A8__init__2]();
function createRenderContext(cache, key = Symbol(), up = cache) {
  return renderContext.context = cache[key] || (cache[key] = new RenderContext(up, key));
}
function getRenderContext() {
  let ctx = renderContext.context;
  let res = ctx || new RenderContext(null);
  if (true) {
    if (!ctx && renderer.stack.length > 0) {
      console.warn("detected unmemoized nodes in", renderer.stack, "see https://imba.io", res);
    }
    ;
  }
  ;
  if (ctx) {
    renderContext.context = null;
  }
  ;
  return res;
}

// node_modules/imba/src/imba/dom/core.web.imba
function extend$__(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function iter$__2(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8parent = Symbol.for("#parent");
var \u03A8closestNode = Symbol.for("#closestNode");
var \u03A8parentNode = Symbol.for("#parentNode");
var \u03A8context = Symbol.for("#context");
var \u03A8__init__3 = Symbol.for("#__init__");
var \u03A8getRenderContext2 = Symbol.for("#getRenderContext");
var \u03A8getDynamicContext2 = Symbol.for("#getDynamicContext");
var \u03A8insertChild = Symbol.for("#insertChild");
var \u03A8appendChild = Symbol.for("#appendChild");
var \u03A8replaceChild = Symbol.for("#replaceChild");
var \u03A8removeChild = Symbol.for("#removeChild");
var \u03A8insertInto = Symbol.for("#insertInto");
var \u03A8insertIntoDeopt = Symbol.for("#insertIntoDeopt");
var \u03A8removeFrom = Symbol.for("#removeFrom");
var \u03A8removeFromDeopt = Symbol.for("#removeFromDeopt");
var \u03A8replaceWith = Symbol.for("#replaceWith");
var \u03A8replaceWithDeopt = Symbol.for("#replaceWithDeopt");
var \u03A8placeholderNode = Symbol.for("#placeholderNode");
var \u03A8attachToParent = Symbol.for("#attachToParent");
var \u03A8detachFromParent = Symbol.for("#detachFromParent");
var \u03A8placeChild = Symbol.for("#placeChild");
var \u03A8beforeReconcile = Symbol.for("#beforeReconcile");
var \u03A8afterReconcile = Symbol.for("#afterReconcile");
var \u03A8afterVisit = Symbol.for("#afterVisit");
var \u03A8__initor__5 = Symbol.for("#__initor__");
var \u03A8__inited__5 = Symbol.for("#__inited__");
var \u03A8\u03A8parent = Symbol.for("##parent");
var \u03A8\u03A8up = Symbol.for("##up");
var \u03A8\u03A8context = Symbol.for("##context");
var \u03A8domNode = Symbol.for("#domNode");
var \u03A8\u03A8placeholderNode = Symbol.for("##placeholderNode");
var \u03A8domDeopt = Symbol.for("#domDeopt");
var \u03A8isRichElement = Symbol.for("#isRichElement");
var \u03A8src = Symbol.for("#src");
var \u03A8htmlNodeName = Symbol.for("#htmlNodeName");
var \u03A8getSlot = Symbol.for("#getSlot");
var \u03A8ImbaElement = Symbol.for("#ImbaElement");
var \u03A8cssns = Symbol.for("#cssns");
var \u03A8cssid = Symbol.for("#cssid");
var \u03C62 = Symbol();
var {
  Event,
  UIEvent,
  MouseEvent,
  PointerEvent,
  KeyboardEvent,
  CustomEvent,
  Node,
  Comment,
  Text,
  Element,
  HTMLElement,
  HTMLHtmlElement,
  HTMLSelectElement,
  HTMLInputElement,
  HTMLTextAreaElement,
  HTMLButtonElement,
  HTMLOptionElement,
  HTMLScriptElement,
  SVGElement,
  DocumentFragment,
  ShadowRoot,
  Document,
  Window,
  customElements
} = globalThis.window;
var descriptorCache = {};
function getDescriptor(item, key, cache) {
  if (!item) {
    return cache[key] = null;
  }
  ;
  if (cache[key] !== void 0) {
    return cache[key];
  }
  ;
  let desc = Object.getOwnPropertyDescriptor(item, key);
  if (desc !== void 0 || item == SVGElement) {
    return cache[key] = desc || null;
  }
  ;
  return getDescriptor(Reflect.getPrototypeOf(item), key, cache);
}
var CustomTagConstructors = {};
var CustomTagToElementNames = {};
var TYPES = {};
var CUSTOM_TYPES = {};
var contextHandler = {
  get(target, name) {
    let ctx = target;
    let val = void 0;
    while (ctx && val == void 0) {
      if (ctx = ctx[\u03A8parent]) {
        val = ctx[name];
      }
      ;
    }
    ;
    return val;
  },
  set(target, name, value) {
    let ctx = target;
    let val = void 0;
    while (ctx && val == void 0) {
      let desc = getDeepPropertyDescriptor(ctx, name, Element);
      if (desc) {
        ctx[name] = value;
        return true;
      } else {
        ctx = ctx[\u03A8parent];
      }
      ;
    }
    ;
    return true;
  }
};
var Extend$Document$af = class {
  get flags() {
    return this.documentElement.flags;
  }
};
extend$__(Document.prototype, Extend$Document$af.prototype);
var Extend$Node$ag = class {
  get [\u03A8parent]() {
    return this[\u03A8\u03A8parent] || this.parentNode || this[\u03A8\u03A8up];
  }
  get [\u03A8closestNode]() {
    return this;
  }
  get [\u03A8parentNode]() {
    return this[\u03A8parent][\u03A8closestNode];
  }
  get [\u03A8context]() {
    return this[\u03A8\u03A8context] || (this[\u03A8\u03A8context] = new Proxy(this, contextHandler));
  }
  [\u03A8__init__3]() {
    return this;
  }
  [\u03A8getRenderContext2](sym) {
    return createRenderContext(this, sym);
  }
  [\u03A8getDynamicContext2](sym, key) {
    return this[\u03A8getRenderContext2](sym)[\u03A8getRenderContext2](key);
  }
  [\u03A8insertChild](newnode, refnode) {
    return newnode[\u03A8insertInto](this, refnode);
  }
  [\u03A8appendChild](newnode) {
    return newnode[\u03A8insertInto](this, null);
  }
  [\u03A8replaceChild](newnode, oldnode) {
    let res = this[\u03A8insertChild](newnode, oldnode);
    this[\u03A8removeChild](oldnode);
    return res;
  }
  [\u03A8removeChild](node) {
    return node[\u03A8removeFrom](this);
  }
  [\u03A8insertInto](parent, before = null) {
    if (before) {
      parent.insertBefore(this, before);
    } else {
      parent.appendChild(this);
    }
    ;
    return this;
  }
  [\u03A8insertIntoDeopt](parent, before) {
    if (before) {
      parent.insertBefore(this[\u03A8domNode] || this, before);
    } else {
      parent.appendChild(this[\u03A8domNode] || this);
    }
    ;
    return this;
  }
  [\u03A8removeFrom](parent) {
    return parent.removeChild(this);
  }
  [\u03A8removeFromDeopt](parent) {
    return parent.removeChild(this[\u03A8domNode] || this);
  }
  [\u03A8replaceWith](other, parent) {
    return parent[\u03A8replaceChild](other, this);
  }
  [\u03A8replaceWithDeopt](other, parent) {
    return parent[\u03A8replaceChild](other, this[\u03A8domNode] || this);
  }
  get [\u03A8placeholderNode]() {
    return this[\u03A8\u03A8placeholderNode] || (this[\u03A8\u03A8placeholderNode] = globalThis.document.createComment("placeholder"));
  }
  set [\u03A8placeholderNode](value) {
    let prev = this[\u03A8\u03A8placeholderNode];
    this[\u03A8\u03A8placeholderNode] = value;
    if (prev && prev != value && prev.parentNode) {
      prev[\u03A8replaceWith](value);
    }
    ;
  }
  [\u03A8attachToParent]() {
    let ph = this[\u03A8domNode];
    let par = ph && ph.parentNode;
    if (ph && par && ph != this) {
      this[\u03A8domNode] = null;
      this[\u03A8insertInto](par, ph);
      ph[\u03A8removeFrom](par);
    }
    ;
    return this;
  }
  [\u03A8detachFromParent]() {
    if (this[\u03A8domDeopt] != true ? (this[\u03A8domDeopt] = true, true) : false) {
      this[\u03A8replaceWith] = this[\u03A8replaceWithDeopt];
      this[\u03A8removeFrom] = this[\u03A8removeFromDeopt];
      this[\u03A8insertInto] = this[\u03A8insertIntoDeopt];
    }
    ;
    let ph = this[\u03A8placeholderNode];
    if (this.parentNode && ph != this) {
      ph[\u03A8insertInto](this.parentNode, this);
      this[\u03A8removeFrom](this.parentNode);
    }
    ;
    this[\u03A8domNode] = ph;
    return this;
  }
  [\u03A8placeChild](item, f, prev) {
    let type = typeof item;
    if (type === "undefined" || item === null) {
      if (prev && prev instanceof Comment) {
        return prev;
      }
      ;
      let el = globalThis.document.createComment("");
      return prev ? prev[\u03A8replaceWith](el, this) : el[\u03A8insertInto](this, null);
    }
    ;
    if (item === prev) {
      return item;
    } else if (type !== "object") {
      let res;
      let txt = item;
      if (f & 128 && f & 256 && false) {
        this.textContent = txt;
        return;
      }
      ;
      if (prev) {
        if (prev instanceof Text) {
          prev.textContent = txt;
          return prev;
        } else {
          res = globalThis.document.createTextNode(txt);
          prev[\u03A8replaceWith](res, this);
          return res;
        }
        ;
      } else {
        this.appendChild(res = globalThis.document.createTextNode(txt));
        return res;
      }
      ;
    } else {
      if (true) {
        if (!item[\u03A8insertInto]) {
          console.warn("Tried to insert", item, "into", this);
          throw new TypeError("Only DOM Nodes can be inserted into DOM");
        }
        ;
      }
      ;
      return prev ? prev[\u03A8replaceWith](item, this) : item[\u03A8insertInto](this, null);
    }
    ;
    return;
  }
};
extend$__(Node.prototype, Extend$Node$ag.prototype);
var Extend$Element$ah = class {
  log(...params) {
    console.log(...params);
    return this;
  }
  emit(name, detail, o = {bubbles: true, cancelable: true}) {
    if (detail != void 0) {
      o.detail = detail;
    }
    ;
    let event = new CustomEvent(name, o);
    let res = this.dispatchEvent(event);
    return event;
  }
  text$(item) {
    this.textContent = item;
    return this;
  }
  [\u03A8beforeReconcile]() {
    return this;
  }
  [\u03A8afterReconcile]() {
    return this;
  }
  [\u03A8afterVisit]() {
    if (this.render) {
      this.render();
    }
    ;
    return;
  }
  get flags() {
    if (!this.$flags) {
      this.$flags = new Flags(this);
      if (this.flag$ == Element.prototype.flag$) {
        this.flags$ext = this.className;
      }
      ;
      this.flagDeopt$();
    }
    ;
    return this.$flags;
  }
  flag$(str) {
    let ns = this.flags$ns;
    this.className = ns ? ns + (this.flags$ext = str) : this.flags$ext = str;
    return;
  }
  flagDeopt$() {
    var self = this;
    this.flag$ = this.flagExt$;
    self.flagSelf$ = function(str) {
      return self.flagSync$(self.flags$own = str);
    };
    return;
  }
  flagExt$(str) {
    return this.flagSync$(this.flags$ext = str);
  }
  flagSelf$(str) {
    this.flagDeopt$();
    return this.flagSelf$(str);
  }
  flagSync$() {
    return this.className = (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || "");
  }
  set$(key, value) {
    let desc = getDeepPropertyDescriptor(this, key, Element);
    if (!desc || !desc.set) {
      this.setAttribute(key, value);
    } else {
      this[key] = value;
    }
    ;
    return;
  }
  get richValue() {
    return this.value;
  }
  set richValue(value) {
    this.value = value;
  }
};
extend$__(Element.prototype, Extend$Element$ah.prototype);
Element.prototype.setns$ = Element.prototype.setAttributeNS;
Element.prototype[\u03A8isRichElement] = true;
function createElement(name, parent, flags, text) {
  let el = globalThis.document.createElement(name);
  if (flags) {
    el.className = flags;
  }
  ;
  if (text !== null) {
    el.text$(text);
  }
  ;
  if (parent && parent[\u03A8appendChild]) {
    parent[\u03A8appendChild](el);
  }
  ;
  return el;
}
var Extend$SVGElement$ai = class {
  set$(key, value) {
    var \u03C622;
    let cache = descriptorCache[\u03C622 = this.nodeName] || (descriptorCache[\u03C622] = {});
    let desc = getDescriptor(this, key, cache);
    if (!desc || !desc.set) {
      this.setAttribute(key, value);
    } else {
      this[key] = value;
    }
    ;
    return;
  }
  flag$(str) {
    let ns = this.flags$ns;
    this.setAttribute("class", ns ? ns + (this.flags$ext = str) : this.flags$ext = str);
    return;
  }
  flagSelf$(str) {
    var self = this;
    self.flag$ = function(str2) {
      return self.flagSync$(self.flags$ext = str2);
    };
    self.flagSelf$ = function(str2) {
      return self.flagSync$(self.flags$own = str2);
    };
    return self.flagSelf$(str);
  }
  flagSync$() {
    return this.setAttribute("class", (this.flags$ns || "") + (this.flags$ext || "") + " " + (this.flags$own || "") + " " + (this.$flags || ""));
  }
};
extend$__(SVGElement.prototype, Extend$SVGElement$ai.prototype);
var Extend$SVGSVGElement$aj = class {
  set src(value) {
    if (this[\u03A8src] != value ? (this[\u03A8src] = value, true) : false) {
      if (value) {
        if (value.adoptNode) {
          value.adoptNode(this);
        } else if (value.content) {
          for (let o\u03C6 = value.attributes, i\u03C6 = 0, keys\u03C6 = Object.keys(o\u03C6), l\u03C6 = keys\u03C6.length, k, v; i\u03C6 < l\u03C6; i\u03C6++) {
            k = keys\u03C6[i\u03C6];
            v = o\u03C6[k];
            this.setAttribute(k, v);
          }
          ;
          this.innerHTML = value.content;
        }
        ;
      }
      ;
    }
    ;
    return;
  }
};
extend$__(SVGSVGElement.prototype, Extend$SVGSVGElement$aj.prototype);
function createComment(text) {
  return globalThis.document.createComment(text);
}
function createTextNode(text) {
  return globalThis.document.createTextNode(text);
}
var navigator = globalThis.navigator;
var vendor = navigator && navigator.vendor || "";
var ua = navigator && navigator.userAgent || "";
var isSafari = vendor.indexOf("Apple") > -1 || ua.indexOf("CriOS") >= 0 || ua.indexOf("FxiOS") >= 0;
var supportsCustomizedBuiltInElements = !isSafari;
var CustomDescriptorCache = new Map();
var CustomHook = class extends HTMLElement {
  connectedCallback() {
    if (supportsCustomizedBuiltInElements) {
      return this.parentNode.removeChild(this);
    } else {
      return this.parentNode.connectedCallback();
    }
    ;
  }
  disconnectedCallback() {
    if (!supportsCustomizedBuiltInElements) {
      return this.parentNode.disconnectedCallback();
    }
    ;
  }
};
window.customElements.define("i-hook", CustomHook);
function getCustomDescriptors(el, klass) {
  let props = CustomDescriptorCache.get(klass);
  if (!props) {
    props = {};
    let proto = klass.prototype;
    let protos = [proto];
    while (proto = proto && Object.getPrototypeOf(proto)) {
      if (proto.constructor == el.constructor) {
        break;
      }
      ;
      protos.unshift(proto);
    }
    ;
    for (let i\u03C62 = 0, items\u03C6 = iter$__2(protos), len\u03C6 = items\u03C6.length; i\u03C62 < len\u03C6; i\u03C62++) {
      let item = items\u03C6[i\u03C62];
      let desc = Object.getOwnPropertyDescriptors(item);
      Object.assign(props, desc);
    }
    ;
    CustomDescriptorCache.set(klass, props);
  }
  ;
  return props;
}
function createComponent(name, parent, flags, text, ctx) {
  let el;
  if (typeof name != "string") {
    if (name && name.nodeName) {
      name = name.nodeName;
    }
    ;
  }
  ;
  let cmpname = CustomTagToElementNames[name] || name;
  if (CustomTagConstructors[name]) {
    let cls = CustomTagConstructors[name];
    let typ = cls.prototype[\u03A8htmlNodeName];
    if (typ && supportsCustomizedBuiltInElements) {
      el = globalThis.document.createElement(typ, {is: name});
    } else if (cls.create$ && typ) {
      el = globalThis.document.createElement(typ);
      el.setAttribute("is", cmpname);
      let props = getCustomDescriptors(el, cls);
      Object.defineProperties(el, props);
      el.__slots = {};
      el.appendChild(globalThis.document.createElement("i-hook"));
    } else if (cls.create$) {
      el = cls.create$(el);
      el.__slots = {};
    } else {
      console.warn("could not create tag " + name);
    }
    ;
  } else {
    el = globalThis.document.createElement(CustomTagToElementNames[name] || name);
  }
  ;
  el[\u03A8\u03A8parent] = parent;
  el[\u03A8__init__3]();
  if (text !== null) {
    el[\u03A8getSlot]("__").text$(text);
  }
  ;
  if (flags || el.flags$ns) {
    el.flag$(flags || "");
  }
  ;
  return el;
}
function getTagType(name, klass) {
  if (TYPES[name]) {
    return TYPES[name];
  }
  ;
  if (window[klass]) {
    return window[klass];
  }
  ;
  if (window[name]) {
    return window[name];
  }
  ;
}
function getSuperTagType(name, klass, cmp) {
  let typ = getTagType(name, klass);
  let custom = typ == cmp || typ.prototype instanceof cmp || typ.prototype[\u03A8htmlNodeName];
  if (!custom) {
    let cls = typ.prototype[\u03A8ImbaElement];
    if (!cls) {
      cls = class CustomBuiltInElement extends typ {
        static [\u03A8__init__3]() {
          this.prototype[\u03A8__initor__5] = \u03C62;
          return this;
        }
        constructor() {
          super(...arguments);
          this.__slots = {};
          this.__F = 0;
          this[\u03A8__initor__5] === \u03C62 && this[\u03A8__inited__5] && this[\u03A8__inited__5]();
        }
      }[\u03A8__init__3]();
      typ.prototype[\u03A8ImbaElement] = cls;
      let descriptors = Object.getOwnPropertyDescriptors(cmp.prototype);
      Object.defineProperties(cls.prototype, descriptors);
      cls.prototype[\u03A8htmlNodeName] = name;
    }
    ;
    return cls;
  }
  ;
  return typ;
}
function defineTag(name, klass, options = {}) {
  TYPES[name] = CUSTOM_TYPES[name] = klass;
  klass.nodeName = name;
  let componentName = name;
  let proto = klass.prototype;
  if (name.indexOf("-") == -1) {
    componentName = "" + name + "-tag";
    CustomTagToElementNames[name] = componentName;
  }
  ;
  if (options.cssns) {
    let ns = (proto._ns_ || proto[\u03A8cssns] || "") + " " + (options.cssns || "");
    proto._ns_ = ns.trim() + " ";
    proto[\u03A8cssns] = options.cssns;
  }
  ;
  if (options.cssid) {
    let ids = (proto.flags$ns || "") + " " + options.cssid;
    proto[\u03A8cssid] = options.cssid;
    proto.flags$ns = ids.trim() + " ";
  }
  ;
  if (proto[\u03A8htmlNodeName] && !options.extends) {
    options.extends = proto[\u03A8htmlNodeName];
  }
  ;
  if (options.extends) {
    proto[\u03A8htmlNodeName] = options.extends;
    CustomTagConstructors[name] = klass;
    if (supportsCustomizedBuiltInElements) {
      window.customElements.define(componentName, klass, {extends: options.extends});
    }
    ;
  } else {
    window.customElements.define(componentName, klass);
  }
  ;
  return klass;
}
var instance2 = globalThis.imba || (globalThis.imba = {});
instance2.document = globalThis.document;

// node_modules/imba/src/imba/dom/fragment.imba
function iter$__3(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
function extend$__2(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
var \u03A8parent2 = Symbol.for("#parent");
var \u03A8closestNode2 = Symbol.for("#closestNode");
var \u03A8isRichElement2 = Symbol.for("#isRichElement");
var \u03A8afterVisit2 = Symbol.for("#afterVisit");
var \u03A8__initor__6 = Symbol.for("#__initor__");
var \u03A8__inited__6 = Symbol.for("#__inited__");
var \u03A8appendChild2 = Symbol.for("#appendChild");
var \u03A8removeChild2 = Symbol.for("#removeChild");
var \u03A8insertInto2 = Symbol.for("#insertInto");
var \u03A8replaceWith2 = Symbol.for("#replaceWith");
var \u03A8insertChild2 = Symbol.for("#insertChild");
var \u03A8removeFrom2 = Symbol.for("#removeFrom");
var \u03A8placeChild2 = Symbol.for("#placeChild");
var \u03A8__init__4 = Symbol.for("#__init__");
var \u03A8registerFunctionalSlot = Symbol.for("#registerFunctionalSlot");
var \u03A8getFunctionalSlot = Symbol.for("#getFunctionalSlot");
var \u03A8getSlot2 = Symbol.for("#getSlot");
var \u03A8\u03A8parent2 = Symbol.for("##parent");
var \u03A8\u03A8up2 = Symbol.for("##up");
var \u03A8\u03A8flags = Symbol.for("##flags");
var \u03A8domFlags = Symbol.for("#domFlags");
var \u03A8end = Symbol.for("#end");
var \u03A8textContent = Symbol.for("#textContent");
var \u03A8textNode = Symbol.for("#textNode");
var \u03A8functionalSlots = Symbol.for("#functionalSlots");
var \u03C63 = Symbol();
var Fragment = class {
  constructor() {
    this.childNodes = [];
  }
  log(...params) {
    return;
  }
  hasChildNodes() {
    return false;
  }
  set [\u03A8parent2](value) {
    this[\u03A8\u03A8parent2] = value;
  }
  get [\u03A8parent2]() {
    return this[\u03A8\u03A8parent2] || this[\u03A8\u03A8up2];
  }
  get [\u03A8closestNode2]() {
    return this[\u03A8parent2][\u03A8closestNode2];
  }
  get [\u03A8isRichElement2]() {
    return true;
  }
  get flags() {
    return this[\u03A8\u03A8flags] || (this[\u03A8\u03A8flags] = new Flags(this));
  }
  flagSync$() {
    return this;
  }
  [\u03A8afterVisit2]() {
    return this;
  }
};
var counter = 0;
var VirtualFragment = class extends Fragment {
  static [\u03A8__init__4]() {
    this.prototype[\u03A8__initor__6] = \u03C63;
    return this;
  }
  constructor(flags, parent) {
    super(...arguments);
    this[\u03A8\u03A8up2] = parent;
    this.parentNode = null;
    this[\u03A8domFlags] = flags;
    this.childNodes = [];
    this[\u03A8end] = createComment("slot" + counter++);
    if (parent) {
      parent[\u03A8appendChild2](this);
    }
    ;
    this[\u03A8__initor__6] === \u03C63 && this[\u03A8__inited__6] && this[\u03A8__inited__6]();
  }
  get [\u03A8parent2]() {
    return this[\u03A8\u03A8parent2] || this.parentNode || this[\u03A8\u03A8up2];
  }
  set textContent(text) {
    this[\u03A8textContent] = text;
  }
  get textContent() {
    return this[\u03A8textContent];
  }
  hasChildNodes() {
    for (let i\u03C6 = 0, items\u03C6 = iter$__3(this.childNodes), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let item = items\u03C6[i\u03C6];
      if (item instanceof Fragment) {
        if (item.hasChildNodes()) {
          return true;
        }
        ;
      }
      ;
      if (item instanceof Comment) {
        true;
      } else if (item instanceof Node) {
        return true;
      }
      ;
    }
    ;
    return false;
  }
  text$(item) {
    if (!this[\u03A8textNode]) {
      this[\u03A8textNode] = this[\u03A8placeChild2](item);
    } else {
      this[\u03A8textNode].textContent = item;
    }
    ;
    return this[\u03A8textNode];
  }
  appendChild(child) {
    if (this.parentNode) {
      child[\u03A8insertInto2](this.parentNode, this[\u03A8end]);
    }
    ;
    return this.childNodes.push(child);
  }
  [\u03A8appendChild2](child) {
    if (this.parentNode) {
      child[\u03A8insertInto2](this.parentNode, this[\u03A8end]);
    }
    ;
    return this.childNodes.push(child);
  }
  insertBefore(node, refnode) {
    if (this.parentNode) {
      this.parentNode[\u03A8insertChild2](node, refnode);
    }
    ;
    let idx = this.childNodes.indexOf(refnode);
    if (idx >= 0) {
      this.childNodes.splice(idx, 0, node);
    }
    ;
    return node;
  }
  [\u03A8removeChild2](node) {
    if (this.parentNode) {
      this.parentNode[\u03A8removeChild2](node);
    }
    ;
    let idx = this.childNodes.indexOf(node);
    if (idx >= 0) {
      this.childNodes.splice(idx, 1);
    }
    ;
    return;
  }
  [\u03A8insertInto2](parent, before) {
    let prev = this.parentNode;
    if (this.parentNode != parent ? (this.parentNode = parent, true) : false) {
      if (this[\u03A8end]) {
        before = this[\u03A8end][\u03A8insertInto2](parent, before);
      }
      ;
      for (let i\u03C62 = 0, items\u03C62 = iter$__3(this.childNodes), len\u03C62 = items\u03C62.length; i\u03C62 < len\u03C62; i\u03C62++) {
        let item = items\u03C62[i\u03C62];
        item[\u03A8insertInto2](parent, before);
      }
      ;
    }
    ;
    return this;
  }
  [\u03A8replaceWith2](node, parent) {
    let res = node[\u03A8insertInto2](parent, this[\u03A8end]);
    this[\u03A8removeFrom2](parent);
    return res;
  }
  [\u03A8insertChild2](node, refnode) {
    if (this.parentNode) {
      this.insertBefore(node, refnode || this[\u03A8end]);
    }
    ;
    if (refnode) {
      let idx = this.childNodes.indexOf(refnode);
      if (idx >= 0) {
        this.childNodes.splice(idx, 0, node);
      }
      ;
    } else {
      this.childNodes.push(node);
    }
    ;
    return node;
  }
  [\u03A8removeFrom2](parent) {
    for (let i\u03C63 = 0, items\u03C63 = iter$__3(this.childNodes), len\u03C63 = items\u03C63.length; i\u03C63 < len\u03C63; i\u03C63++) {
      let item = items\u03C63[i\u03C63];
      item[\u03A8removeFrom2](parent);
    }
    ;
    if (this[\u03A8end]) {
      this[\u03A8end][\u03A8removeFrom2](parent);
    }
    ;
    this.parentNode = null;
    return this;
  }
  [\u03A8placeChild2](item, f, prev) {
    let par = this.parentNode;
    let type = typeof item;
    if (type === "undefined" || item === null) {
      if (prev && prev instanceof Comment) {
        return prev;
      }
      ;
      let el = createComment("");
      if (prev) {
        let idx = this.childNodes.indexOf(prev);
        this.childNodes.splice(idx, 1, el);
        if (par) {
          prev[\u03A8replaceWith2](el, par);
        }
        ;
        return el;
      }
      ;
      this.childNodes.push(el);
      if (par) {
        el[\u03A8insertInto2](par, this[\u03A8end]);
      }
      ;
      return el;
    }
    ;
    if (item === prev) {
      return item;
    }
    ;
    if (type !== "object") {
      let res;
      let txt = item;
      if (prev) {
        if (prev instanceof Text) {
          prev.textContent = txt;
          return prev;
        } else {
          res = createTextNode(txt);
          let idx = this.childNodes.indexOf(prev);
          this.childNodes.splice(idx, 1, res);
          if (par) {
            prev[\u03A8replaceWith2](res, par);
          }
          ;
          return res;
        }
        ;
      } else {
        this.childNodes.push(res = createTextNode(txt));
        if (par) {
          res[\u03A8insertInto2](par, this[\u03A8end]);
        }
        ;
        return res;
      }
      ;
    } else if (prev) {
      let idx = this.childNodes.indexOf(prev);
      this.childNodes.splice(idx, 1, item);
      if (par) {
        prev[\u03A8replaceWith2](item, par);
      }
      ;
      return item;
    } else {
      this.childNodes.push(item);
      if (par) {
        item[\u03A8insertInto2](par, this[\u03A8end]);
      }
      ;
      return item;
    }
    ;
  }
};
VirtualFragment[\u03A8__init__4]();
function createSlot(bitflags, par) {
  const el = new VirtualFragment(bitflags, null);
  el[\u03A8\u03A8up2] = par;
  return el;
}
var Extend$Node$af = class {
  [\u03A8registerFunctionalSlot](name) {
    let map = this[\u03A8functionalSlots] || (this[\u03A8functionalSlots] = {});
    return map[name] || (map[name] = createSlot(0, this));
  }
  [\u03A8getFunctionalSlot](name, context) {
    let map = this[\u03A8functionalSlots];
    return map && map[name] || this[\u03A8getSlot2](name, context);
  }
  [\u03A8getSlot2](name, context) {
    var \u03C622;
    if (name == "__" && !this.render) {
      return this;
    }
    ;
    return (\u03C622 = this.__slots)[name] || (\u03C622[name] = createSlot(0, this));
  }
};
extend$__2(Node.prototype, Extend$Node$af.prototype);

// node_modules/imba/src/imba/dom/indexed-list.imba
function iter$__4(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8afterVisit3 = Symbol.for("#afterVisit");
var \u03A8insertInto3 = Symbol.for("#insertInto");
var \u03A8appendChild3 = Symbol.for("#appendChild");
var \u03A8replaceWith3 = Symbol.for("#replaceWith");
var \u03A8removeFrom3 = Symbol.for("#removeFrom");
var \u03A8__initor__7 = Symbol.for("#__initor__");
var \u03A8__inited__7 = Symbol.for("#__inited__");
var \u03A8__init__5 = Symbol.for("#__init__");
var \u03A8domFlags2 = Symbol.for("#domFlags");
var \u03A8\u03A8parent3 = Symbol.for("##parent");
var \u03A8end2 = Symbol.for("#end");
var \u03A8removeChild3 = Symbol.for("#removeChild");
var \u03A8insertChild3 = Symbol.for("#insertChild");
var \u03C64 = Symbol();
var IndexedTagFragment = class extends Fragment {
  static [\u03A8__init__5]() {
    this.prototype[\u03A8__initor__7] = \u03C64;
    return this;
  }
  constructor(f, parent) {
    super(...arguments);
    this[\u03A8domFlags2] = f;
    this[\u03A8\u03A8parent3] = parent;
    if (!(f & 256)) {
      this[\u03A8end2] = createComment("list");
    }
    ;
    this.$ = this.childNodes;
    this.length = 0;
    if (parent) {
      parent[\u03A8appendChild3](this);
    }
    ;
    this[\u03A8__initor__7] === \u03C64 && this[\u03A8__inited__7] && this[\u03A8__inited__7]();
  }
  hasChildNodes() {
    if (this.length == 0) {
      return false;
    }
    ;
    return true;
  }
  [\u03A8afterVisit3](len) {
    let from = this.length;
    this.length = len;
    if (from == len) {
      return;
    }
    ;
    let par = this.parentNode;
    if (!par) {
      return;
    }
    ;
    let array = this.childNodes;
    let end = this[\u03A8end2];
    if (from > len) {
      while (from > len) {
        par[\u03A8removeChild3](array[--from]);
      }
      ;
    } else if (len > from) {
      while (len > from) {
        par[\u03A8insertChild3](array[from++], end);
      }
      ;
    }
    ;
    this.length = len;
    return;
  }
  [\u03A8insertInto3](parent, before) {
    this.parentNode = parent;
    if (this[\u03A8end2]) {
      this[\u03A8end2][\u03A8insertInto3](parent, before);
    }
    ;
    before = this[\u03A8end2];
    for (let i = 0, items\u03C6 = iter$__4(this.childNodes), len\u03C6 = items\u03C6.length; i < len\u03C6; i++) {
      let item = items\u03C6[i];
      if (i == this.length) {
        break;
      }
      ;
      item[\u03A8insertInto3](parent, before);
    }
    ;
    return this;
  }
  [\u03A8appendChild3](item) {
    return;
  }
  [\u03A8replaceWith3](rel, parent) {
    let res = rel[\u03A8insertInto3](parent, this[\u03A8end2]);
    this[\u03A8removeFrom3](parent);
    return res;
  }
  [\u03A8removeFrom3](parent) {
    let i = this.length;
    while (i > 0) {
      let el = this.childNodes[--i];
      el[\u03A8removeFrom3](parent);
    }
    ;
    if (this[\u03A8end2]) {
      parent.removeChild(this[\u03A8end2]);
    }
    ;
    this.parentNode = null;
    return;
  }
};
IndexedTagFragment[\u03A8__init__5]();
function createIndexedList(bitflags, parent) {
  return new IndexedTagFragment(bitflags, parent);
}

// node_modules/imba/src/imba/dom/component.imba
function iter$__5(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8__init__6 = Symbol.for("#__init__");
var \u03A8__initor__8 = Symbol.for("#__initor__");
var \u03A8__inited__8 = Symbol.for("#__inited__");
var \u03A8afterVisit4 = Symbol.for("#afterVisit");
var \u03A8beforeReconcile2 = Symbol.for("#beforeReconcile");
var \u03A8afterReconcile2 = Symbol.for("#afterReconcile");
var \u03A8count = Symbol.for("#count");
var \u03A8autorender = Symbol.for("#autorender");
var \u03C65 = Symbol();
var hydrator = new class {
  constructor($$ = null) {
    this[\u03A8__init__6]($$);
  }
  [\u03A8__init__6]($$ = null) {
    var v\u03C6;
    this.items = $$ && (v\u03C6 = $$.items) !== void 0 ? v\u03C6 : [];
    this.current = $$ && (v\u03C6 = $$.current) !== void 0 ? v\u03C6 : null;
    this.lastQueued = $$ && (v\u03C6 = $$.lastQueued) !== void 0 ? v\u03C6 : null;
    this.tests = $$ && (v\u03C6 = $$.tests) !== void 0 ? v\u03C6 : 0;
  }
  flush() {
    let item = null;
    if (false) {
    }
    ;
    while (item = this.items.shift()) {
      if (!item.parentNode || item.hydrated\u03A6) {
        continue;
      }
      ;
      let prev = this.current;
      this.current = item;
      item.__F |= 1024;
      item.connectedCallback();
      this.current = prev;
    }
    ;
    return;
  }
  queue(item) {
    var self = this;
    let len = this.items.length;
    let idx = 0;
    let prev = this.lastQueued;
    this.lastQueued = item;
    let BEFORE = Node.DOCUMENT_POSITION_PRECEDING;
    let AFTER = Node.DOCUMENT_POSITION_FOLLOWING;
    if (len) {
      let prevIndex = this.items.indexOf(prev);
      let index = prevIndex;
      let compare = function(a, b) {
        self.tests++;
        return a.compareDocumentPosition(b);
      };
      if (prevIndex == -1 || prev.nodeName != item.nodeName) {
        index = prevIndex = 0;
      }
      ;
      let curr = self.items[index];
      while (curr && compare(curr, item) & AFTER) {
        curr = self.items[++index];
      }
      ;
      if (index != prevIndex) {
        curr ? self.items.splice(index, 0, item) : self.items.push(item);
      } else {
        while (curr && compare(curr, item) & BEFORE) {
          curr = self.items[--index];
        }
        ;
        if (index != prevIndex) {
          curr ? self.items.splice(index + 1, 0, item) : self.items.unshift(item);
        }
        ;
      }
      ;
    } else {
      self.items.push(item);
      if (!self.current) {
        globalThis.queueMicrotask(self.flush.bind(self));
      }
      ;
    }
    ;
    return;
  }
  run(item) {
    var \u03C632, \u03C622;
    if (this.active) {
      return;
    }
    ;
    this.active = true;
    let all = globalThis.document.querySelectorAll(".__ssr");
    console.log("running hydrator", item, all.length, Array.from(all));
    for (let i\u03C6 = 0, items\u03C6 = iter$__5(all), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let item2 = items\u03C6[i\u03C6];
      item2[\u03A8count] || (item2[\u03A8count] = 1);
      item2[\u03A8count]++;
      let name = item2.nodeName;
      let typ = (\u03C622 = this.map)[name] || (\u03C622[name] = globalThis.window.customElements.get(name.toLowerCase()) || HTMLElement);
      console.log("item type", name, typ, !!CUSTOM_TYPES[name.toLowerCase()]);
      if (!item2.connectedCallback || !item2.parentNode || item2.hydrated\u03A6) {
        continue;
      }
      ;
      console.log("hydrate", item2);
    }
    ;
    return this.active = false;
  }
}();
var Component = class extends HTMLElement {
  static [\u03A8__init__6]() {
    this.prototype[\u03A8__initor__8] = \u03C65;
    return this;
  }
  constructor() {
    super();
    if (this.flags$ns) {
      this.flag$ = this.flagExt$;
    }
    ;
    this.setup$();
    this.build();
    this[\u03A8__initor__8] === \u03C65 && this[\u03A8__inited__8] && this[\u03A8__inited__8]();
  }
  setup$() {
    this.__slots = {};
    return this.__F = 0;
  }
  [\u03A8__init__6]() {
    this.__F |= 1 | 2;
    return this;
  }
  flag$(str) {
    this.className = this.flags$ext = str;
    return;
  }
  build() {
    return this;
  }
  awaken() {
    return this;
  }
  mount() {
    return this;
  }
  unmount() {
    return this;
  }
  rendered() {
    return this;
  }
  dehydrate() {
    return this;
  }
  hydrate() {
    this.autoschedule = true;
    return this;
  }
  tick() {
    return this.commit();
  }
  visit() {
    return this.commit();
  }
  commit() {
    if (!this.render\u03A6) {
      this.__F |= 8192;
      return this;
    }
    ;
    this.__F |= 256;
    this.render && this.render();
    this.rendered();
    return this.__F = (this.__F | 512) & ~256 & ~8192;
  }
  get autoschedule() {
    return (this.__F & 64) != 0;
  }
  set autoschedule(value) {
    value ? this.__F |= 64 : this.__F &= ~64;
  }
  set autorender(value) {
    let o = this[\u03A8autorender] || (this[\u03A8autorender] = {});
    o.value = value;
    if (this.mounted\u03A6) {
      scheduler.schedule(this, o);
    }
    ;
    return;
  }
  get render\u03A6() {
    return !this.suspended\u03A6;
  }
  get mounting\u03A6() {
    return (this.__F & 16) != 0;
  }
  get mounted\u03A6() {
    return (this.__F & 32) != 0;
  }
  get awakened\u03A6() {
    return (this.__F & 8) != 0;
  }
  get rendered\u03A6() {
    return (this.__F & 512) != 0;
  }
  get suspended\u03A6() {
    return (this.__F & 4096) != 0;
  }
  get rendering\u03A6() {
    return (this.__F & 256) != 0;
  }
  get scheduled\u03A6() {
    return (this.__F & 128) != 0;
  }
  get hydrated\u03A6() {
    return (this.__F & 2) != 0;
  }
  get ssr\u03A6() {
    return (this.__F & 1024) != 0;
  }
  schedule() {
    scheduler.on("commit", this);
    this.__F |= 128;
    return this;
  }
  unschedule() {
    scheduler.un("commit", this);
    this.__F &= ~128;
    return this;
  }
  async suspend(cb = null) {
    let val = this.flags.incr("_suspended_");
    this.__F |= 4096;
    if (cb instanceof Function) {
      await cb();
      this.unsuspend();
    }
    ;
    return this;
  }
  unsuspend() {
    let val = this.flags.decr("_suspended_");
    if (val == 0) {
      this.__F &= ~4096;
      this.commit();
      ;
    }
    ;
    return this;
  }
  [\u03A8afterVisit4]() {
    return this.visit();
  }
  [\u03A8beforeReconcile2]() {
    if (this.__F & 1024) {
      this.__F = this.__F & ~1024;
      this.classList.remove("_ssr_");
      if (this.flags$ext && this.flags$ext.indexOf("_ssr_") == 0) {
        this.flags$ext = this.flags$ext.slice(5);
      }
      ;
      if (!(this.__F & 512)) {
        this.innerHTML = "";
      }
      ;
    }
    ;
    if (true) {
      renderer.push(this);
    }
    ;
    return this;
  }
  [\u03A8afterReconcile2]() {
    if (true) {
      renderer.pop(this);
    }
    ;
    return this;
  }
  connectedCallback() {
    let flags = this.__F;
    let inited = flags & 1;
    let awakened = flags & 8;
    if (!inited && !(flags & 1024)) {
      hydrator.queue(this);
      return;
    }
    ;
    if (flags & (16 | 32)) {
      return;
    }
    ;
    this.__F |= 16;
    if (!inited) {
      this[\u03A8__init__6]();
    }
    ;
    if (!(flags & 2)) {
      this.flags$ext = this.className;
      this.__F |= 2;
      this.hydrate();
      this.commit();
    }
    ;
    if (!awakened) {
      this.awaken();
      this.__F |= 8;
    }
    ;
    let res = this.mount();
    if (res && res.then instanceof Function) {
      res.then(scheduler.commit);
    }
    ;
    flags = this.__F = (this.__F | 32) & ~16;
    if (flags & 64) {
      this.schedule();
    }
    ;
    if (this[\u03A8autorender]) {
      scheduler.schedule(this, this[\u03A8autorender]);
    }
    ;
    return this;
  }
  disconnectedCallback() {
    this.__F = this.__F & (~32 & ~16);
    if (this.__F & 128) {
      this.unschedule();
    }
    ;
    this.unmount();
    if (this[\u03A8autorender]) {
      return scheduler.unschedule(this, this[\u03A8autorender]);
    }
    ;
  }
};
Component[\u03A8__init__6]();

// node_modules/imba/src/imba/dom/styles.imba
function extend$__3(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
var \u03A8__init__7 = Symbol.for("#__init__");
var \u03A8__initor__9 = Symbol.for("#__initor__");
var \u03A8__inited__9 = Symbol.for("#__inited__");
var VALID_CSS_UNITS = {
  cm: 1,
  mm: 1,
  Q: 1,
  pc: 1,
  pt: 1,
  px: 1,
  em: 1,
  ex: 1,
  ch: 1,
  rem: 1,
  vw: 1,
  vh: 1,
  vmin: 1,
  vmax: 1,
  s: 1,
  ms: 1,
  fr: 1,
  "%": 1,
  in: 1,
  turn: 1,
  grad: 1,
  rad: 1,
  deg: 1,
  Hz: 1,
  kHz: 1
};
var CSS_STR_PROPS = {
  prefix: 1,
  suffix: 1,
  content: 1
};
var CSS_COLORS = {
  rose: [[356, 100, 97], [356, 100, 95], [353, 96, 90], [353, 96, 82], [351, 95, 71], [350, 89, 60], [347, 77, 50], [345, 83, 41], [343, 80, 35], [342, 75, 30]],
  pink: [[327, 73, 97], [326, 78, 95], [326, 85, 90], [327, 87, 82], [329, 86, 70], [330, 81, 60], [333, 71, 51], [335, 78, 42], [336, 74, 35], [336, 69, 30]],
  fuchsia: [[289, 100, 98], [287, 100, 95], [288, 96, 91], [291, 93, 83], [292, 91, 73], [292, 84, 61], [293, 69, 49], [295, 72, 40], [295, 70, 33], [297, 64, 28]],
  purple: [[270, 100, 98], [269, 100, 95], [269, 100, 92], [269, 97, 85], [270, 95, 75], [271, 91, 65], [271, 81, 56], [272, 72, 47], [273, 67, 39], [274, 66, 32]],
  violet: [[250, 100, 98], [251, 91, 95], [251, 95, 92], [252, 95, 85], [255, 92, 76], [258, 90, 66], [262, 83, 58], [263, 70, 50], [263, 69, 42], [264, 67, 35]],
  indigo: [[226, 100, 97], [226, 100, 94], [228, 96, 89], [230, 94, 82], [234, 89, 74], [239, 84, 67], [243, 75, 59], [245, 58, 51], [244, 55, 41], [242, 47, 34]],
  blue: [[214, 100, 97], [214, 95, 93], [213, 97, 87], [212, 96, 78], [213, 94, 68], [217, 91, 60], [221, 83, 53], [224, 76, 48], [226, 71, 40], [224, 64, 33]],
  sky: [[204, 100, 97], [204, 94, 94], [201, 94, 86], [199, 95, 74], [198, 93, 60], [199, 89, 48], [200, 98, 39], [201, 96, 32], [201, 90, 27], [202, 80, 24]],
  cyan: [[183, 100, 96], [185, 96, 90], [186, 94, 82], [187, 92, 69], [188, 86, 53], [189, 94, 43], [192, 91, 36], [193, 82, 31], [194, 70, 27], [196, 64, 24]],
  teal: [[166, 76, 97], [167, 85, 89], [168, 84, 78], [171, 77, 64], [172, 66, 50], [173, 80, 40], [175, 84, 32], [175, 77, 26], [176, 69, 22], [176, 61, 19]],
  emerald: [[152, 81, 96], [149, 80, 90], [152, 76, 80], [156, 72, 67], [158, 64, 52], [160, 84, 39], [161, 94, 30], [163, 94, 24], [163, 88, 20], [164, 86, 16]],
  green: [[138, 76, 97], [141, 84, 93], [141, 79, 85], [142, 77, 73], [142, 69, 58], [142, 71, 45], [142, 76, 36], [142, 72, 29], [143, 64, 24], [144, 61, 20]],
  lime: [[78, 92, 95], [80, 89, 89], [81, 88, 80], [82, 85, 67], [83, 78, 55], [84, 81, 44], [85, 85, 35], [86, 78, 27], [86, 69, 23], [88, 61, 20]],
  yellow: [[55, 92, 95], [55, 97, 88], [53, 98, 77], [50, 98, 64], [48, 96, 53], [45, 93, 47], [41, 96, 40], [35, 92, 33], [32, 81, 29], [28, 73, 26]],
  amber: [[48, 100, 96], [48, 96, 89], [48, 97, 77], [46, 97, 65], [43, 96, 56], [38, 92, 50], [32, 95, 44], [26, 90, 37], [23, 83, 31], [22, 78, 26]],
  orange: [[33, 100, 96], [34, 100, 92], [32, 98, 83], [31, 97, 72], [27, 96, 61], [25, 95, 53], [21, 90, 48], [17, 88, 40], [15, 79, 34], [15, 75, 28]],
  red: [[0, 86, 97], [0, 93, 94], [0, 96, 89], [0, 94, 82], [0, 91, 71], [0, 84, 60], [0, 72, 51], [0, 74, 42], [0, 70, 35], [0, 63, 31]],
  warmer: [[60, 9, 98], [60, 5, 96], [20, 6, 90], [24, 6, 83], [24, 5, 64], [25, 5, 45], [33, 5, 32], [30, 6, 25], [12, 6, 15], [24, 10, 10]],
  warm: [[0, 0, 98], [0, 0, 96], [0, 0, 90], [0, 0, 83], [0, 0, 64], [0, 0, 45], [0, 0, 32], [0, 0, 25], [0, 0, 15], [0, 0, 9]],
  gray: [[0, 0, 98], [240, 5, 96], [240, 6, 90], [240, 5, 84], [240, 5, 65], [240, 4, 46], [240, 5, 34], [240, 5, 26], [240, 4, 16], [240, 6, 10]],
  cool: [[210, 20, 98], [220, 14, 96], [220, 13, 91], [216, 12, 84], [218, 11, 65], [220, 9, 46], [215, 14, 34], [217, 19, 27], [215, 28, 17], [221, 39, 11]],
  cooler: [[210, 40, 98], [210, 40, 96], [214, 32, 91], [213, 27, 84], [215, 20, 65], [215, 16, 47], [215, 19, 35], [215, 25, 27], [217, 33, 17], [222, 47, 11]]
};
var CSS_COLORS_REGEX = new RegExp("^(" + Object.keys(CSS_COLORS).join("|") + ")(\\d+(?:\\.\\d+)?)$");
var CSS_PX_PROPS = /^([xyz])$/;
var CSS_DIM_PROPS = /^([tlbr]|size|[whtlbr]|[mps][tlbrxy]?|[rcxy]?[gs])$/;
var resets = "*,::before,::after {\nbox-sizing: border-box;\nborder-width: 0;\nborder-style: solid;\nborder-color: currentColor;\n}";
var Styles = class {
  constructor($$ = null) {
    this[\u03A8__init__7]($$);
  }
  [\u03A8__init__7]($$ = null) {
    var v\u03C6;
    this.entries = $$ && (v\u03C6 = $$.entries) !== void 0 ? v\u03C6 : {};
  }
  register(id, styles2) {
    let entry = this.entries[id];
    if (!entry) {
      entry = this.entries[id] = {sourceId: id, css: styles2};
      if (!this.entries.resets) {
        this.register("resets", resets);
      }
      ;
      entry.node = globalThis.document.createElement("style");
      entry.node.setAttribute("data-id", id);
      entry.node.textContent = entry.css;
      globalThis.document.head.appendChild(entry.node);
      ;
    } else if (entry) {
      entry.css = styles2;
      if (entry.node) {
        entry.node.textContent = styles2;
      }
      ;
    }
    ;
    return;
  }
  toString() {
    return Object.values(this.entries).map(function(_0) {
      return _0.css;
    }).join("\n\n");
  }
  toValue(value, unit, key, param = null) {
    let colormatch;
    if (CSS_STR_PROPS[key]) {
      value = String(value);
    }
    ;
    let typ = typeof value;
    if (typ == "number") {
      if (!unit) {
        if (CSS_PX_PROPS.test(key)) {
          unit = "px";
        } else if (CSS_DIM_PROPS.test(key)) {
          unit = "u";
        } else if (key == "rotate") {
          unit = "turn";
          value = (value % 1).toFixed(4);
        }
        ;
      }
      ;
      if (unit) {
        if (VALID_CSS_UNITS[unit]) {
          return value + unit;
        } else if (unit == "u") {
          return value * 4 + "px";
        } else {
          return "calc(var(--u_" + unit + ",1px) * " + value + ")";
        }
        ;
      } else {
        true;
      }
      ;
    } else if (typ == "string") {
      if (key && CSS_STR_PROPS[key] && value[0] != '"' && value[0] != "'") {
        if (value.indexOf('"') >= 0) {
          if (value.indexOf("'") == -1) {
            value = "'" + value + "'";
          } else {
            false;
          }
          ;
        } else {
          value = '"' + value + '"';
        }
        ;
      }
      ;
      if (colormatch = value.match(CSS_COLORS_REGEX)) {
        let color = CSS_COLORS[colormatch[1]];
        let level = color[parseInt(colormatch[2])];
        let a = "100%";
        if (typeof param == "number") {
          a = param + "%";
        } else if (typeof param == "string") {
          a = param;
        }
        ;
        if (level) {
          return "hsla(" + level[0] + "," + level[1] + "%," + level[2] + "%," + a + ")";
        }
        ;
      }
      ;
    } else if (value && value.toStyleString instanceof Function) {
      return value.toStyleString();
    }
    ;
    return value;
  }
  parseDimension(val) {
    if (typeof val == "string") {
      let [m, num, unit] = val.match(/^([-+]?[\d\.]+)(%|\w+)$/);
      return [parseFloat(num), unit];
    } else if (typeof val == "number") {
      return [val];
    }
    ;
  }
};
var styles = new Styles();
var colors = Object.keys(CSS_COLORS);
function use_styles() {
  return true;
}
var Extend$Element$af = class {
  css$(key, value, mods) {
    return this.style[key] = value;
  }
  css$var(name, value, unit, key, param = null) {
    let cssval = styles.toValue(value, unit, key, param);
    this.style.setProperty(name, cssval);
    return;
  }
};
extend$__3(Element.prototype, Extend$Element$af.prototype);

// node_modules/imba/src/imba/dom/mount.imba
var \u03A8insertInto4 = Symbol.for("#insertInto");
var \u03A8removeFrom4 = Symbol.for("#removeFrom");
function mount(mountable, into) {
  if (false) {
  }
  ;
  let parent = into || globalThis.document.body;
  let element = mountable;
  if (mountable instanceof Function) {
    let ctx = new RenderContext(parent, null);
    let tick = function() {
      let prev = renderContext.context;
      renderContext.context = ctx;
      let res = mountable(ctx);
      if (renderContext.context == ctx) {
        renderContext.context = prev;
      }
      ;
      return res;
    };
    element = tick();
    scheduler.listen("commit", tick);
  } else {
    element.__F |= 64;
  }
  ;
  element[\u03A8insertInto4](parent);
  return element;
}
function unmount(el) {
  if (el && el[\u03A8removeFrom4]) {
    el[\u03A8removeFrom4](el.parentNode);
  }
  ;
  return el;
}
var instance3 = globalThis.imba || (globalThis.imba = {});
instance3.mount = mount;
instance3.unmount = unmount;

// node_modules/imba/src/imba/events/keyboard.imba
function extend$__4(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function use_events_keyboard() {
  return true;
}
var Extend$KeyboardEvent$af = class {
  \u03B1esc() {
    return this.keyCode == 27;
  }
  \u03B1tab() {
    return this.keyCode == 9;
  }
  \u03B1enter() {
    return this.keyCode == 13;
  }
  \u03B1space() {
    return this.keyCode == 32;
  }
  \u03B1up() {
    return this.keyCode == 38;
  }
  \u03B1down() {
    return this.keyCode == 40;
  }
  \u03B1left() {
    return this.keyCode == 37;
  }
  \u03B1right() {
    return this.keyCode == 39;
  }
  \u03B1del() {
    return this.keyCode == 8 || this.keyCode == 46;
  }
  \u03B1key(code) {
    if (typeof code == "string") {
      return this.key == code;
    } else if (typeof code == "number") {
      return this.keyCode == code;
    }
    ;
  }
};
extend$__4(KeyboardEvent.prototype, Extend$KeyboardEvent$af.prototype);

// node_modules/imba/src/imba/events/mouse.imba
function extend$__5(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function use_events_mouse() {
  return true;
}
var Extend$MouseEvent$af = class {
  \u03B1left() {
    return this.button == 0;
  }
  \u03B1middle() {
    return this.button == 1;
  }
  \u03B1right() {
    return this.button == 2;
  }
  \u03B1shift() {
    return !!this.shiftKey;
  }
  \u03B1alt() {
    return !!this.altKey;
  }
  \u03B1ctrl() {
    return !!this.ctrlKey;
  }
  \u03B1meta() {
    return !!this.metaKey;
  }
  \u03B1mod() {
    let nav = globalThis.navigator.platform;
    return /^(Mac|iPhone|iPad|iPod)/.test(nav || "") ? !!this.metaKey : !!this.ctrlKey;
  }
};
extend$__5(MouseEvent.prototype, Extend$MouseEvent$af.prototype);

// node_modules/imba/src/imba/events/core.imba
function extend$__6(target, ext) {
  const descriptors = Object.getOwnPropertyDescriptors(ext);
  delete descriptors.constructor;
  Object.defineProperties(target, descriptors);
  return target;
}
function iter$__6(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8extendType = Symbol.for("#extendType");
var \u03A8modifierState = Symbol.for("#modifierState");
var \u03A8sharedModifierState = Symbol.for("#sharedModifierState");
var \u03A8onceHandlerEnd = Symbol.for("#onceHandlerEnd");
var \u03A8__initor__10 = Symbol.for("#__initor__");
var \u03A8__inited__10 = Symbol.for("#__inited__");
var \u03A8extendDescriptors = Symbol.for("#extendDescriptors");
var \u03A8context2 = Symbol.for("#context");
var \u03A8self = Symbol.for("#self");
var \u03A8target = Symbol.for("#target");
var \u03A8stopPropagation = Symbol.for("#stopPropagation");
var \u03A8defaultPrevented = Symbol.for("#defaultPrevented");
use_events_keyboard();
use_events_mouse();
var Extend$CustomEvent$af = class {
  [\u03A8extendType](kls) {
    var \u03C622, desc, \u03C66;
    let ext = kls[\u03A8extendDescriptors] || (kls[\u03A8extendDescriptors] = (desc = Object.getOwnPropertyDescriptors(kls.prototype), \u03C66 = desc.constructor, delete desc.constructor, \u03C66, desc));
    return Object.defineProperties(this, ext);
  }
};
extend$__6(CustomEvent.prototype, Extend$CustomEvent$af.prototype);
var Extend$Event$ag = class {
  get [\u03A8modifierState]() {
    var \u03C642, \u03C632;
    return (\u03C642 = this[\u03A8context2])[\u03C632 = this[\u03A8context2].step] || (\u03C642[\u03C632] = {});
  }
  get [\u03A8sharedModifierState]() {
    var \u03C66, \u03C652;
    return (\u03C66 = this[\u03A8context2].handler)[\u03C652 = this[\u03A8context2].step] || (\u03C66[\u03C652] = {});
  }
  [\u03A8onceHandlerEnd](cb) {
    return once(this[\u03A8context2], "end", cb);
  }
  \u03B1sel(selector) {
    return !!this.target.matches(String(selector));
  }
  \u03B1closest(selector) {
    return !!this.target.closest(String(selector));
  }
  \u03B1log(...params) {
    console.info(...params);
    return true;
  }
  \u03B1trusted() {
    return !!this.isTrusted;
  }
  \u03B1if(expr) {
    return !!expr;
  }
  \u03B1wait(time = 250) {
    return new Promise(function(_0) {
      return setTimeout(_0, parseTime(time));
    });
  }
  \u03B1self() {
    return this.target == this[\u03A8context2].element;
  }
  \u03B1cooldown(time = 250) {
    let o = this[\u03A8sharedModifierState];
    if (o.active) {
      return false;
    }
    ;
    o.active = true;
    o.target = this[\u03A8context2].element;
    o.target.flags.incr("cooldown");
    this[\u03A8onceHandlerEnd](function() {
      return setTimeout(function() {
        o.target.flags.decr("cooldown");
        return o.active = false;
      }, parseTime(time));
    });
    return true;
  }
  \u03B1throttle(time = 250) {
    let o = this[\u03A8sharedModifierState];
    if (o.active) {
      if (o.next) {
        o.next(false);
      }
      ;
      return new Promise(function(r) {
        return o.next = function(val) {
          o.next = null;
          return r(val);
        };
      });
    }
    ;
    o.active = true;
    o.el || (o.el = this[\u03A8context2].element);
    o.el.flags.incr("throttled");
    once(this[\u03A8context2], "end", function() {
      let delay = parseTime(time);
      return o.interval = setInterval(function() {
        if (o.next) {
          o.next(true);
        } else {
          clearInterval(o.interval);
          o.el.flags.decr("throttled");
          o.active = false;
        }
        ;
        return;
      }, delay);
    });
    return true;
  }
  \u03B1debounce(time = 250) {
    let o = this[\u03A8sharedModifierState];
    let e = this;
    o.queue || (o.queue = []);
    o.queue.push(o.last = e);
    return new Promise(function(resolve) {
      return setTimeout(function() {
        if (o.last == e) {
          e.debounced = o.queue;
          o.last = null;
          o.queue = [];
          return resolve(true);
        } else {
          return resolve(false);
        }
        ;
      }, parseTime(time));
    });
  }
  \u03B1flag(name, sel) {
    const {element, step, state: state2, id, current} = this[\u03A8context2];
    let el = sel instanceof Element ? sel : sel ? element.closest(sel) : element;
    if (!el) {
      return true;
    }
    ;
    this[\u03A8context2].commit = true;
    state2[step] = id;
    el.flags.incr(name);
    let ts = Date.now();
    once(current, "end", function() {
      let elapsed = Date.now() - ts;
      let delay = Math.max(250 - elapsed, 0);
      return setTimeout(function() {
        return el.flags.decr(name);
      }, delay);
    });
    return true;
  }
  \u03B1busy(sel) {
    return this["\u03B1flag"]("busy", sel);
  }
  \u03B1mod(name) {
    return this["\u03B1flag"]("mod-" + name, globalThis.document.documentElement);
  }
  \u03B1outside() {
    const {handler} = this[\u03A8context2];
    if (handler && handler[\u03A8self]) {
      return !handler[\u03A8self].parentNode.contains(this.target);
    }
    ;
  }
};
extend$__6(Event.prototype, Extend$Event$ag.prototype);
function use_events() {
  return true;
}
var EventHandler = class {
  constructor(params, closure) {
    this.params = params;
    this.closure = closure;
  }
  getHandlerForMethod(el, name) {
    if (!el) {
      return null;
    }
    ;
    return el[name] ? el : this.getHandlerForMethod(el.parentNode, name);
  }
  emit(name, ...params) {
    return emit(this, name, params);
  }
  on(name, ...params) {
    return listen(this, name, ...params);
  }
  once(name, ...params) {
    return once(this, name, ...params);
  }
  un(name, ...params) {
    return unlisten(this, name, ...params);
  }
  get passive\u03A6() {
    return this.params.passive;
  }
  get capture\u03A6() {
    return this.params.capture;
  }
  get silent\u03A6() {
    return this.params.silent;
  }
  get global\u03A6() {
    return this.params.global;
  }
  async handleEvent(event) {
    let element = this[\u03A8target] || event.currentTarget;
    let mods = this.params;
    let error = null;
    let silence = mods.silence || mods.silent;
    this.count || (this.count = 0);
    this.state || (this.state = {});
    let state2 = {
      element,
      event,
      modifiers: mods,
      handler: this,
      id: ++this.count,
      step: -1,
      state: this.state,
      commit: null,
      current: null
    };
    state2.current = state2;
    if (event.handle$mod) {
      if (event.handle$mod.apply(state2, mods.options || []) == false) {
        return;
      }
      ;
    }
    ;
    let guard = Event[this.type + "$handle"] || Event[event.type + "$handle"] || event.handle$mod;
    if (guard && guard.apply(state2, mods.options || []) == false) {
      return;
    }
    ;
    this.currentEvents || (this.currentEvents = new Set());
    this.currentEvents.add(event);
    for (let i\u03C6 = 0, keys\u03C6 = Object.keys(mods), l\u03C6 = keys\u03C6.length, handler, val; i\u03C6 < l\u03C6; i\u03C6++) {
      handler = keys\u03C6[i\u03C6];
      val = mods[handler];
      state2.step++;
      if (handler[0] == "_") {
        continue;
      }
      ;
      if (handler.indexOf("~") > 0) {
        handler = handler.split("~")[0];
      }
      ;
      let modargs = null;
      let args = [event, state2];
      let res = void 0;
      let context = null;
      let m;
      let negated = false;
      let isstring = typeof handler == "string";
      if (handler[0] == "$" && handler[1] == "_" && val[0] instanceof Function) {
        handler = val[0];
        if (!handler.passive) {
          state2.commit = true;
        }
        ;
        args = [event, state2].concat(val.slice(1));
        context = element;
      } else if (val instanceof Array) {
        args = val.slice();
        modargs = args;
        for (let i = 0, items\u03C6 = iter$__6(args), len\u03C62 = items\u03C6.length; i < len\u03C62; i++) {
          let par = items\u03C6[i];
          if (typeof par == "string" && par[0] == "~" && par[1] == "$") {
            let name = par.slice(2);
            let chain = name.split(".");
            let value = state2[chain.shift()] || event;
            for (let i2 = 0, items\u03C62 = iter$__6(chain), len\u03C6 = items\u03C62.length; i2 < len\u03C6; i2++) {
              let part = items\u03C62[i2];
              value = value ? value[part] : void 0;
            }
            ;
            args[i] = value;
          }
          ;
        }
        ;
      }
      ;
      if (typeof handler == "string" && (m = handler.match(/^(emit|flag|mod|moved|pin|fit|refit|map|remap|css)-(.+)$/))) {
        if (!modargs) {
          modargs = args = [];
        }
        ;
        args.unshift(m[2]);
        handler = m[1];
      }
      ;
      if (handler == "trap") {
        event[\u03A8stopPropagation] = true;
        event.stopImmediatePropagation();
        event[\u03A8defaultPrevented] = true;
        event.preventDefault();
      } else if (handler == "stop") {
        event[\u03A8stopPropagation] = true;
        event.stopImmediatePropagation();
      } else if (handler == "prevent") {
        event[\u03A8defaultPrevented] = true;
        event.preventDefault();
      } else if (handler == "commit") {
        state2.commit = true;
      } else if (handler == "once") {
        element.removeEventListener(event.type, this);
      } else if (handler == "options" || handler == "silence" || handler == "silent") {
        continue;
      } else if (handler == "emit") {
        let name = args[0];
        let detail = args[1];
        let e = new CustomEvent(name, {bubbles: true, detail});
        e.originalEvent = event;
        let customRes = element.dispatchEvent(e);
      } else if (typeof handler == "string") {
        if (handler[0] == "!") {
          negated = true;
          handler = handler.slice(1);
        }
        ;
        let path = "\u03B1" + handler;
        let fn = event[path];
        fn || (fn = this.type && Event[this.type + "$" + handler + "$mod"]);
        fn || (fn = event[handler + "$mod"] || Event[event.type + "$" + handler] || Event[handler + "$mod"]);
        if (fn instanceof Function) {
          handler = fn;
          context = state2;
          args = modargs || [];
          if (event[path]) {
            context = event;
            event[\u03A8context2] = state2;
          }
          ;
        } else if (handler[0] == "_") {
          handler = handler.slice(1);
          context = this.closure;
        } else {
          context = this.getHandlerForMethod(element, handler);
        }
        ;
      }
      ;
      try {
        if (handler instanceof Function) {
          res = handler.apply(context || element, args);
        } else if (context) {
          res = context[handler].apply(context, args);
        }
        ;
        if (res && res.then instanceof Function && res != scheduler.$promise) {
          if (state2.commit && !silence) {
            scheduler.commit();
          }
          ;
          res = await res;
        }
        ;
      } catch (e) {
        error = e;
        break;
      }
      ;
      if (negated && res === true) {
        break;
      }
      ;
      if (!negated && res === false) {
        break;
      }
      ;
      state2.value = res;
    }
    ;
    emit(state2, "end", state2);
    if (state2.commit && !silence) {
      scheduler.commit();
    }
    ;
    this.currentEvents.delete(event);
    if (this.currentEvents.size == 0) {
      this.emit("idle");
    }
    ;
    if (error) {
      throw error;
    }
    ;
    return;
  }
};
var Extend$Element$ah2 = class {
  on$(type, mods, scope) {
    let check = "on$" + type;
    let handler;
    handler = new EventHandler(mods, scope);
    let capture = mods.capture || false;
    let passive = mods.passive;
    let o = capture;
    if (passive) {
      o = {passive, capture};
    }
    ;
    if (this[check] instanceof Function) {
      handler = this[check](mods, scope, handler, o);
    } else {
      this.addEventListener(type, handler, o);
    }
    ;
    return handler;
  }
};
extend$__6(Element.prototype, Extend$Element$ah2.prototype);

// app/variables/morseCode.imba
var morseCode = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "?": "..--.."
};
var morseCode_default = morseCode;

// app/components/morse-test/morse-letter.imba
var \u03A8__init__8 = Symbol.for("#__init__");
var \u03A8beforeReconcile3 = Symbol.for("#beforeReconcile");
var \u03A8placeChild3 = Symbol.for("#placeChild");
var \u03A8afterReconcile3 = Symbol.for("#afterReconcile");
var \u03B5SELF = Symbol();
var \u03B5T = Symbol();
var al\u03C6 = Symbol();
var am\u03C6 = Symbol();
var an\u03C6 = Symbol();
var ao\u03C6 = Symbol();
var \u03B5i = Symbol();
var \u03B5 = Symbol();
use_events(), use_events_mouse(), use_styles();
var MorseLetterComponent = class extends Component {
  [\u03A8__init__8]($$ = null) {
    var v\u03C6;
    super[\u03A8__init__8](...arguments);
    this.value = $$ && (v\u03C6 = $$.value) !== void 0 ? v\u03C6 : "";
    this.morseValue = $$ && (v\u03C6 = $$.morseValue) !== void 0 ? v\u03C6 : "";
    this.displayValue = $$ && (v\u03C6 = $$.displayValue) !== void 0 ? v\u03C6 : "";
    this.morse = $$ && (v\u03C6 = $$.morse) !== void 0 ? v\u03C6 : false;
    this.color = $$ && (v\u03C6 = $$.color) !== void 0 ? v\u03C6 : 1;
    this.hsl = $$ && (v\u03C6 = $$.hsl) !== void 0 ? v\u03C6 : "hsl(hue, 50%, light)";
  }
  flipValue() {
    this.morse = !this.morse;
    return this.setMorseValue();
  }
  setMorseValue() {
    this.displayValue = this.value;
    if (this.morse) {
      let upperCase = this.value.toUpperCase();
      return this.displayValue = morseCode_default[upperCase];
    }
    ;
  }
  setColor() {
    this.hsl = this.hsl.replace("hue", this.color);
    this.$bgc = this.hsl.replace("light", "80%");
    this.$shadow = this.hsl.replace("light", "60%");
    this.$hoverBgc = this.hsl.replace("light", "70%");
    return this.$hoverShadow = this.hsl.replace("light", "50%");
  }
  setup() {
    this.setColor();
    return this.setMorseValue();
  }
  render() {
    var self = this, \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C66 = this._ns_ || "", \u03C4T, \u03B9T, \u0394T, \u03C5T;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile3]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("dj_");
    (\u03B9T = \u0394T = 1, \u03C4T = \u03C4SELF[\u03B5T]) || (\u03B9T = \u0394T = 0, \u03C4SELF[\u03B5T] = \u03C4T = createElement("div", \u03C4SELF, `dj-ag letter dj_ ${\u03C66}`, null));
    \u03C5T = self.$bgc, \u03C5T === \u03C4SELF[al\u03C6] || \u03C4T.css$var("--dj_ah", \u03C4SELF[al\u03C6] = \u03C5T, null, "--bgc");
    \u03C5T = self.$shadow, \u03C5T === \u03C4SELF[am\u03C6] || \u03C4T.css$var("--dj_ai", \u03C4SELF[am\u03C6] = \u03C5T, null, "--shadow");
    \u03C5T = self.$hoverBgc, \u03C5T === \u03C4SELF[an\u03C6] || \u03C4T.css$var("--dj_aj", \u03C4SELF[an\u03C6] = \u03C5T, null, "--hoverBgc");
    \u03C5T = self.$hoverShadow, \u03C5T === \u03C4SELF[ao\u03C6] || \u03C4T.css$var("--dj_ak", \u03C4SELF[ao\u03C6] = \u03C5T, null, "--hoverShadow");
    \u03B9T || \u03C4T.on$(`click`, {$_: [function(e, $$) {
      return self.flipValue(e);
    }]}, this);
    \u03C5T = self.displayValue, \u03C5T === \u03C4SELF[\u03B5] && \u03B9T || (\u03C4SELF[\u03B5i] = \u03C4T[\u03A8placeChild3](\u03C4SELF[\u03B5] = \u03C5T, 384, \u03C4SELF[\u03B5i]));
    ;
    \u03C4SELF[\u03A8afterReconcile3](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("morse-letter", MorseLetterComponent, {});

// app/components/morse-test/morse-word.imba
function iter$__7(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8__init__9 = Symbol.for("#__init__");
var \u03A8beforeReconcile4 = Symbol.for("#beforeReconcile");
var \u03A8\u03A8up3 = Symbol.for("##up");
var \u03A8afterVisit5 = Symbol.for("#afterVisit");
var \u03A8afterReconcile4 = Symbol.for("#afterReconcile");
var \u03B5SELF2 = Symbol();
var \u03B5T2 = Symbol();
var \u03B52 = Symbol();
var aj\u03C6 = Symbol();
var ak\u03C6 = Symbol();
var al\u03C62 = Symbol();
var MorseWordComponent = class extends Component {
  [\u03A8__init__9]($$ = null) {
    var v\u03C6;
    super[\u03A8__init__9](...arguments);
    this.value = $$ && (v\u03C6 = $$.value) !== void 0 ? v\u03C6 : "";
    this.morse = $$ && (v\u03C6 = $$.morse) !== void 0 ? v\u03C6 : true;
    this.color = $$ && (v\u03C6 = $$.color) !== void 0 ? v\u03C6 : 1;
  }
  setColor() {
    return this.color = Math.floor(Math.random() * 256);
  }
  render() {
    var \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C66 = this._ns_ || "", \u03C4T, \u03C4, \u03BA, \u03C1, \u03C4T22, \u03B9T, \u0394T, \u03C5T;
    this.setColor();
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile4]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF2] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF2] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("dm_");
    (\u03C4T = \u03C4SELF[\u03B5T2]) || (\u03C4SELF[\u03B5T2] = \u03C4T = createElement("div", \u03C4SELF, `word dm_ ${\u03C66}`, null));
    (\u03C4 = \u03C4SELF[\u03B52]) || (\u03C4SELF[\u03B52] = \u03C4 = createIndexedList(384, \u03C4T));
    \u03BA = 0;
    \u03C1 = \u03C4.$;
    for (let i\u03C6 = 0, items\u03C6 = iter$__7(this.value.toUpperCase()), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let letter = items\u03C6[i\u03C6];
      (\u03B9T = \u0394T = 1, \u03C4T22 = \u03C1[\u03BA]) || (\u03B9T = \u0394T = 0, \u03C1[\u03BA] = \u03C4T22 = createComponent("morse-letter", \u03C4, `dm_ ${\u03C66}`, null));
      \u03B9T || (\u03C4T22[\u03A8\u03A8up3] = \u03C4);
      \u03C5T = this.color, \u03C5T === \u03C4T22[aj\u03C6] || (\u03C4T22.color = \u03C4T22[aj\u03C6] = \u03C5T);
      \u03C5T = this.morse, \u03C5T === \u03C4T22[ak\u03C6] || (\u03C4T22.morse = \u03C4T22[ak\u03C6] = \u03C5T);
      letter === \u03C4T22[al\u03C62] || (\u03C4T22.value = \u03C4T22[al\u03C62] = letter);
      \u03B9T || !\u03C4T22.setup || \u03C4T22.setup(\u0394T);
      \u03C4T22[\u03A8afterVisit5](\u0394T);
      \u03BA++;
    }
    ;
    \u03C4[\u03A8afterVisit5](\u03BA);
    ;
    ;
    \u03C4SELF[\u03A8afterReconcile4](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("morse-word", MorseWordComponent, {});

// app/components/morse-test/morse-words-example.imba
var \u03A8beforeReconcile5 = Symbol.for("#beforeReconcile");
var \u03A8afterVisit6 = Symbol.for("#afterVisit");
var \u03A8appendChild4 = Symbol.for("#appendChild");
var \u03A8afterReconcile5 = Symbol.for("#afterReconcile");
var \u03B5SELF3 = Symbol();
var \u03B5T3 = Symbol();
var \u03B5T22 = Symbol();
var \u03B5T32 = Symbol();
var \u03B5T4 = Symbol();
var MorseWordsExampleComponent = class extends Component {
  render() {
    var \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C66 = this._ns_ || "", \u03C4T, \u03B9T, \u0394T, \u03C4T22, \u03B9T22, \u0394T22, \u03C4T3, \u03B9T3, \u0394T3, \u03C4T4, \u03B9T4, \u0394T4;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile5]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF3] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF3] = 1);
    (\u03B9T = \u0394T = 1, \u03C4T = \u03C4SELF[\u03B5T3]) || (\u03B9T = \u0394T = 0, \u03C4SELF[\u03B5T3] = \u03C4T = createComponent("morse-word", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T || (\u03C4T.value = "Hello");
    \u03B9T || !\u03C4T.setup || \u03C4T.setup(\u0394T);
    \u03C4T[\u03A8afterVisit6](\u0394T);
    \u03B9T || \u03C4SELF[\u03A8appendChild4](\u03C4T);
    ;
    (\u03B9T22 = \u0394T22 = 1, \u03C4T22 = \u03C4SELF[\u03B5T22]) || (\u03B9T22 = \u0394T22 = 0, \u03C4SELF[\u03B5T22] = \u03C4T22 = createComponent("morse-word", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T22 || (\u03C4T22.value = "How");
    \u03B9T22 || !\u03C4T22.setup || \u03C4T22.setup(\u0394T22);
    \u03C4T22[\u03A8afterVisit6](\u0394T22);
    \u03B9T22 || \u03C4SELF[\u03A8appendChild4](\u03C4T22);
    ;
    (\u03B9T3 = \u0394T3 = 1, \u03C4T3 = \u03C4SELF[\u03B5T32]) || (\u03B9T3 = \u0394T3 = 0, \u03C4SELF[\u03B5T32] = \u03C4T3 = createComponent("morse-word", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T3 || (\u03C4T3.value = "are");
    \u03B9T3 || !\u03C4T3.setup || \u03C4T3.setup(\u0394T3);
    \u03C4T3[\u03A8afterVisit6](\u0394T3);
    \u03B9T3 || \u03C4SELF[\u03A8appendChild4](\u03C4T3);
    ;
    (\u03B9T4 = \u0394T4 = 1, \u03C4T4 = \u03C4SELF[\u03B5T4]) || (\u03B9T4 = \u0394T4 = 0, \u03C4SELF[\u03B5T4] = \u03C4T4 = createComponent("morse-word", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T4 || (\u03C4T4.value = "you?");
    \u03B9T4 || !\u03C4T4.setup || \u03C4T4.setup(\u0394T4);
    \u03C4T4[\u03A8afterVisit6](\u0394T4);
    \u03B9T4 || \u03C4SELF[\u03A8appendChild4](\u03C4T4);
    ;
    \u03C4SELF[\u03A8afterReconcile5](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("morse-words-example", MorseWordsExampleComponent, {});

// app/components/hangman/functions/getOptions.imba
function createHangmanOptions(word) {
  let options = word.split("");
  options = [...new Set(options)];
  while (options.length !== word.length * 2) {
    const code = Math.floor(Math.random() * 26) + 65;
    const char$ = String.fromCharCode(code);
    if (options.includes(char$)) {
      continue;
    }
    ;
    options.push(char$);
    options.sort(function() {
      return Math.random() - 0.5;
    });
  }
  ;
  return options;
}

// app/components/hangman/variables/wordList.imba
var wordList_default = [
  "Abuse",
  "Adult",
  "Agent",
  "Anger",
  "Apple",
  "Award",
  "Basis",
  "Beach",
  "Birth",
  "Block",
  "Blood",
  "Board",
  "Brain",
  "Bread",
  "Break",
  "Brown",
  "Buyer",
  "Cause",
  "Chain",
  "Chair",
  "Chest",
  "Chief",
  "Child",
  "China",
  "Claim",
  "Class",
  "Clock",
  "Coach",
  "Coast",
  "Court",
  "Cover",
  "Cream",
  "Crime",
  "Cross",
  "Crowd",
  "Crown",
  "Cycle",
  "Dance",
  "Death",
  "Depth",
  "Doubt",
  "Draft",
  "Drama",
  "Dream",
  "Dress",
  "Drink",
  "Drive",
  "Earth",
  "Enemy",
  "Entry",
  "Error",
  "Event",
  "Faith",
  "Fault",
  "Field",
  "Fight",
  "Final",
  "Floor",
  "Focus",
  "Force",
  "Frame",
  "Frank",
  "Front",
  "Fruit",
  "Glass",
  "Grant",
  "Grass",
  "Green",
  "Group",
  "Guide",
  "Heart",
  "Henry",
  "Horse",
  "Hotel",
  "House",
  "Image",
  "Index",
  "Input",
  "Issue",
  "Japan",
  "Jones",
  "Judge",
  "Knife",
  "Laura",
  "Layer",
  "Level",
  "Lewis",
  "Light",
  "Limit",
  "Lunch",
  "Major",
  "March",
  "Match",
  "Metal",
  "Model",
  "Money",
  "Month",
  "Motor",
  "Mouth",
  "Music",
  "Night",
  "Noise",
  "North",
  "Novel",
  "Nurse",
  "Offer",
  "Order",
  "Other",
  "Owner",
  "Panel",
  "Paper",
  "Party",
  "Peace",
  "Peter",
  "Phase",
  "Phone",
  "Piece",
  "Pilot",
  "Pitch",
  "Place",
  "Plane",
  "Plant",
  "Plate",
  "Point",
  "Pound",
  "Power",
  "Press",
  "Price",
  "Pride",
  "Prize",
  "Proof",
  "Queen",
  "Radio",
  "Range",
  "Ratio",
  "Reply",
  "Right",
  "River",
  "Round",
  "Route",
  "Rugby",
  "Scale",
  "Scene",
  "Scope",
  "Score",
  "Sense",
  "Shape",
  "Share",
  "Sheep",
  "Sheet",
  "Shift",
  "Shirt",
  "Shock",
  "Sight",
  "Simon",
  "Skill",
  "Sleep",
  "Smile",
  "Smith",
  "Smoke",
  "Sound",
  "South",
  "Space",
  "Speed",
  "Spite",
  "Sport",
  "Squad",
  "Staff",
  "Stage",
  "Start",
  "State",
  "Steam",
  "Steel",
  "Stock",
  "Stone",
  "Store",
  "Study",
  "Stuff",
  "Style",
  "Sugar",
  "Table",
  "Taste",
  "Terry",
  "Theme",
  "Thing",
  "Title",
  "Total",
  "Touch",
  "Tower",
  "Track",
  "Trade",
  "Train",
  "Trend",
  "Trial",
  "Trust",
  "Truth",
  "Uncle",
  "Union",
  "Unity",
  "Value",
  "Video",
  "Visit",
  "Voice",
  "Waste",
  "Watch",
  "Water",
  "While",
  "White",
  "Whole",
  "Woman",
  "World",
  "Youth",
  "Area",
  "Army",
  "Baby",
  "Back",
  "Ball",
  "Band",
  "Bank",
  "Base",
  "Bean",
  "Bill",
  "Body",
  "Book",
  "Call",
  "Card",
  "Care",
  "Case",
  "Cash",
  "City",
  "Club",
  "Cost",
  "Date",
  "Deal",
  "Door",
  "Duty",
  "East",
  "Edge",
  "Face",
  "Fact",
  "Farm",
  "Fear",
  "Fig",
  "File",
  "Film",
  "Fire",
  "Firm",
  "Fish",
  "Food",
  "Foot",
  "Form",
  "Fund",
  "Game",
  "Girl",
  "Goal",
  "Gold",
  "Hair",
  "Half",
  "Hall",
  "Hand",
  "Head",
  "Help",
  "Hill",
  "Home",
  "Hope",
  "Hour",
  "Idea",
  "Jack",
  "John",
  "Kind",
  "King",
  "Lack",
  "Lady",
  "Land",
  "Life",
  "Line",
  "List",
  "Look",
  "Lord",
  "Loss",
  "Love",
  "Mark",
  "Mary",
  "Mind",
  "Miss",
  "Move",
  "Name",
  "Need",
  "News",
  "Note",
  "Page",
  "Pain",
  "Pair",
  "Park",
  "Part",
  "Past",
  "Path",
  "Paul",
  "Plan",
  "Play",
  "Post",
  "Race",
  "Rain",
  "Rate",
  "Rest",
  "Rise",
  "Risk",
  "Road",
  "Rock",
  "Role",
  "Room",
  "Rule",
  "Sale",
  "Seat",
  "Shop",
  "Show",
  "Side",
  "Sign",
  "Site",
  "Size",
  "Skin",
  "Sort",
  "Star",
  "Step",
  "Task",
  "Team",
  "Term",
  "Test",
  "Text",
  "Time",
  "Tour",
  "Town",
  "Tree",
  "Turn",
  "Type",
  "Unit",
  "User",
  "View",
  "Wall",
  "Week",
  "West",
  "Wife",
  "Will",
  "Wind",
  "Wine",
  "Wood",
  "Word",
  "Work",
  "Year"
];

// app/components/hangman/functions/getWord.imba
function getWord_default() {
  const index = Math.floor(Math.random() * wordList_default.length);
  return wordList_default[index].toUpperCase();
}

// app/components/hangman/variables/state.imba
var \u03A8game = Symbol.for("#game");
var State = class {
  create() {
    this.word = getWord_default();
    this.correct = new Set();
    this.options = createHangmanOptions(this.word);
    this.guesses = [];
    this.mistakes = [];
    this.score = 0;
    return this.over = false;
  }
};
var state = new State();
var GameStateComponent = class extends Component {
  get [\u03A8game]() {
    return state;
  }
};
defineTag("game-state", GameStateComponent, {});

// app/components/hangman/hangman.imba
function iter$__8(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8game2 = Symbol.for("#game");
var \u03A8beforeReconcile6 = Symbol.for("#beforeReconcile");
var \u03A8afterVisit7 = Symbol.for("#afterVisit");
var \u03A8appendChild5 = Symbol.for("#appendChild");
var \u03A8afterReconcile6 = Symbol.for("#afterReconcile");
var \u03B5SELF4 = Symbol();
var am\u03C62 = Symbol();
var \u03B5T5 = Symbol();
var \u03B5T23 = Symbol();
var \u03B5T33 = Symbol();
var \u03B5T42 = Symbol();
var \u03B5T52 = Symbol();
use_events();
var HangmanComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  guess(event) {
    this[\u03A8game2].guesses.push(event.detail);
    let foundLetter = false;
    for (let i\u03C6 = 0, items\u03C6 = iter$__8(this[\u03A8game2].word), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let letter = items\u03C6[i\u03C6];
      if (event.detail === letter) {
        foundLetter = true;
        this[\u03A8game2].correct.add(letter);
        this[\u03A8game2].score += 1;
        if (this[\u03A8game2].score === this[\u03A8game2].word.length) {
          this[\u03A8game2].over = true;
        }
        ;
      }
      ;
    }
    ;
    if (!foundLetter) {
      return this[\u03A8game2].mistakes.push(event.detail);
    }
    ;
  }
  replay() {
    return this[\u03A8game2].create();
  }
  setup() {
    return this[\u03A8game2].create();
  }
  render() {
    var self = this, \u03C4SELF, \u03B9SELF, \u0394SELF, \u03B8SELF, \u03C66 = this._ns_ || "", \u03C4T, \u03B9T, \u0394T, \u03C4T22, \u03B9T22, \u0394T22, \u03C4T3, \u03B9T3, \u0394T3, \u03C4T4, \u03B9T4, \u0394T4, \u03C4T5, \u03B9T5, \u0394T5;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile6]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF4] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF4] = 1);
    \u03B9SELF || \u03C4SELF.on$(`guess`, {debounce: [100], $_: [function(e, $$) {
      return self.guess(e);
    }]}, this);
    \u03B8SELF = \u03C4SELF[am\u03C62] || (\u03C4SELF[am\u03C62] = {$_: [function(e, $$, _2) {
      return _2.replay(e);
    }, null]});
    \u03B8SELF.$_[1] = self;
    \u03B9SELF || \u03C4SELF.on$(`replay`, \u03B8SELF, this);
    (\u03B9T = \u0394T = 1, \u03C4T = \u03C4SELF[\u03B5T5]) || (\u03B9T = \u0394T = 0, \u03C4SELF[\u03B5T5] = \u03C4T = createComponent("hangman-word", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T || !\u03C4T.setup || \u03C4T.setup(\u0394T);
    \u03C4T[\u03A8afterVisit7](\u0394T);
    \u03B9T || \u03C4SELF[\u03A8appendChild5](\u03C4T);
    ;
    (\u03B9T22 = \u0394T22 = 1, \u03C4T22 = \u03C4SELF[\u03B5T23]) || (\u03B9T22 = \u0394T22 = 0, \u03C4SELF[\u03B5T23] = \u03C4T22 = createComponent("hangman-mistakes", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T22 || !\u03C4T22.setup || \u03C4T22.setup(\u0394T22);
    \u03C4T22[\u03A8afterVisit7](\u0394T22);
    \u03B9T22 || \u03C4SELF[\u03A8appendChild5](\u03C4T22);
    ;
    (\u03B9T3 = \u0394T3 = 1, \u03C4T3 = \u03C4SELF[\u03B5T33]) || (\u03B9T3 = \u0394T3 = 0, \u03C4SELF[\u03B5T33] = \u03C4T3 = createComponent("hangman-options", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T3 || !\u03C4T3.setup || \u03C4T3.setup(\u0394T3);
    \u03C4T3[\u03A8afterVisit7](\u0394T3);
    \u03B9T3 || \u03C4SELF[\u03A8appendChild5](\u03C4T3);
    ;
    (\u03B9T4 = \u0394T4 = 1, \u03C4T4 = \u03C4SELF[\u03B5T42]) || (\u03B9T4 = \u0394T4 = 0, \u03C4SELF[\u03B5T42] = \u03C4T4 = createComponent("hangman-result", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T4 || !\u03C4T4.setup || \u03C4T4.setup(\u0394T4);
    \u03C4T4[\u03A8afterVisit7](\u0394T4);
    \u03B9T4 || \u03C4SELF[\u03A8appendChild5](\u03C4T4);
    ;
    (\u03B9T5 = \u0394T5 = 1, \u03C4T5 = \u03C4SELF[\u03B5T52]) || (\u03B9T5 = \u0394T5 = 0, \u03C4SELF[\u03B5T52] = \u03C4T5 = createComponent("hangman-replay", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T5 || !\u03C4T5.setup || \u03C4T5.setup(\u0394T5);
    \u03C4T5[\u03A8afterVisit7](\u0394T5);
    \u03B9T5 || \u03C4SELF[\u03A8appendChild5](\u03C4T5);
    ;
    \u03C4SELF[\u03A8afterReconcile6](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman", HangmanComponent, {cssid: "et-af"});

// app/components/hangman/hangman-word.imba
function iter$__9(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8beforeReconcile7 = Symbol.for("#beforeReconcile");
var \u03A8\u03A8up4 = Symbol.for("##up");
var \u03A8afterVisit8 = Symbol.for("#afterVisit");
var \u03A8game3 = Symbol.for("#game");
var \u03A8afterReconcile7 = Symbol.for("#afterReconcile");
var \u03B5SELF5 = Symbol();
var \u03B53 = Symbol();
var ai\u03C6 = Symbol();
var HangmanWordComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  render() {
    var \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C4, \u03BA, \u03C1, \u03C66 = this._ns_ || "", \u03C4T, \u03B9T, \u0394T;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile7]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF5] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF5] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("eh_");
    (\u03C4 = \u03C4SELF[\u03B53]) || (\u03C4SELF[\u03B53] = \u03C4 = createIndexedList(384, \u03C4SELF));
    \u03BA = 0;
    \u03C1 = \u03C4.$;
    for (let i\u03C6 = 0, items\u03C6 = iter$__9(this[\u03A8game3].word), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let letter = items\u03C6[i\u03C6];
      (\u03B9T = \u0394T = 1, \u03C4T = \u03C1[\u03BA]) || (\u03B9T = \u0394T = 0, \u03C1[\u03BA] = \u03C4T = createComponent("hangman-letter", \u03C4, `eh_ ${\u03C66}`, null));
      \u03B9T || (\u03C4T[\u03A8\u03A8up4] = \u03C4);
      letter === \u03C4T[ai\u03C6] || (\u03C4T.letter = \u03C4T[ai\u03C6] = letter);
      \u03B9T || !\u03C4T.setup || \u03C4T.setup(\u0394T);
      \u03C4T[\u03A8afterVisit8](\u0394T);
      \u03BA++;
    }
    ;
    \u03C4[\u03A8afterVisit8](\u03BA);
    ;
    \u03C4SELF[\u03A8afterReconcile7](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman-word", HangmanWordComponent, {});

// app/components/hangman/hangman-letter.imba
var \u03A8beforeReconcile8 = Symbol.for("#beforeReconcile");
var \u03A8game4 = Symbol.for("#game");
var \u03A8placeChild4 = Symbol.for("#placeChild");
var \u03A8afterReconcile8 = Symbol.for("#afterReconcile");
var \u03B5SELF6 = Symbol();
var \u03B50\u03B9 = Symbol();
var HangmanLetterComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  render() {
    var \u03C40if, \u03C4SELF, \u03B9SELF, \u0394SELF;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile8]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF6] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF6] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("el_");
    \u03C40if = null;
    if (!this[\u03A8game4].correct.has(this.letter)) {
      \u03C40if = "_";
    } else {
      \u03C40if = this.letter;
    }
    ;
    \u03C4SELF[\u03B50\u03B9] = \u03C4SELF[\u03A8placeChild4](\u03C40if, 0, \u03C4SELF[\u03B50\u03B9]);
    \u03C4SELF[\u03A8afterReconcile8](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman-letter", HangmanLetterComponent, {});

// app/components/hangman/hangman-mistakes.imba
function iter$__10(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8beforeReconcile9 = Symbol.for("#beforeReconcile");
var \u03A8\u03A8up5 = Symbol.for("##up");
var \u03A8placeChild5 = Symbol.for("#placeChild");
var \u03A8game5 = Symbol.for("#game");
var \u03A8afterVisit9 = Symbol.for("#afterVisit");
var \u03A8afterReconcile9 = Symbol.for("#afterReconcile");
var \u03B5SELF7 = Symbol();
var \u03B54 = Symbol();
var \u03B5i2 = Symbol();
var \u03B522 = Symbol();
var HangmanMistakesComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  render() {
    var \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C4, \u03BA, \u03C1, \u03C66 = this._ns_ || "", \u03C4T, \u03B9T, \u0394T, \u03C5T;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile9]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF7] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF7] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("eg_");
    (\u03C4 = \u03C4SELF[\u03B54]) || (\u03C4SELF[\u03B54] = \u03C4 = createIndexedList(384, \u03C4SELF));
    \u03BA = 0;
    \u03C1 = \u03C4.$;
    for (let i\u03C6 = 0, items\u03C6 = iter$__10(this[\u03A8game5].mistakes), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let mistake = items\u03C6[i\u03C6];
      (\u03B9T = \u0394T = 1, \u03C4T = \u03C1[\u03BA]) || (\u03B9T = \u0394T = 0, \u03C1[\u03BA] = \u03C4T = createElement("div", \u03C4, `eg_ ${\u03C66}`, null));
      \u03B9T || (\u03C4T[\u03A8\u03A8up5] = \u03C4);
      \u03C5T = mistake, \u03C5T === \u03C4T[\u03B522] && \u03B9T || (\u03C4T[\u03B5i2] = \u03C4T[\u03A8placeChild5](\u03C4T[\u03B522] = \u03C5T, 384, \u03C4T[\u03B5i2]));
      \u03BA++;
    }
    ;
    \u03C4[\u03A8afterVisit9](\u03BA);
    ;
    \u03C4SELF[\u03A8afterReconcile9](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman-mistakes", HangmanMistakesComponent, {});

// app/components/hangman/hangman-options.imba
function iter$__11(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var \u03A8beforeReconcile10 = Symbol.for("#beforeReconcile");
var \u03A8\u03A8up6 = Symbol.for("##up");
var \u03A8game6 = Symbol.for("#game");
var \u03A8afterVisit10 = Symbol.for("#afterVisit");
var \u03A8afterReconcile10 = Symbol.for("#afterReconcile");
var \u03B5SELF8 = Symbol();
var \u03B55 = Symbol();
var ai\u03C62 = Symbol();
var aj\u03C62 = Symbol();
var ak\u03C62 = Symbol();
var HangmanOptionsComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  render() {
    var \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C4, \u03BA, \u03C1, \u03C66 = this._ns_ || "", \u03C4T, \u03B9T, \u0394T, \u03C5T;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile10]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF8] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF8] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("ek_");
    (\u03C4 = \u03C4SELF[\u03B55]) || (\u03C4SELF[\u03B55] = \u03C4 = createIndexedList(384, \u03C4SELF));
    \u03BA = 0;
    \u03C1 = \u03C4.$;
    for (let i\u03C6 = 0, items\u03C6 = iter$__11(this[\u03A8game6].options), len\u03C6 = items\u03C6.length; i\u03C6 < len\u03C6; i\u03C6++) {
      let option = items\u03C6[i\u03C6];
      (\u03B9T = \u0394T = 1, \u03C4T = \u03C1[\u03BA]) || (\u03B9T = \u0394T = 0, \u03C1[\u03BA] = \u03C4T = createComponent("hangman-option", \u03C4, `ek_ ${\u03C66}`, null));
      \u03B9T || (\u03C4T[\u03A8\u03A8up6] = \u03C4);
      option === \u03C4T[ai\u03C62] || (\u03C4T.option = \u03C4T[ai\u03C62] = option);
      \u03C5T = morseCode_default[option], \u03C5T === \u03C4T[aj\u03C62] || (\u03C4T.morse = \u03C4T[aj\u03C62] = \u03C5T);
      \u03C5T = this[\u03A8game6].guesses.includes(option), \u03C5T === \u03C4T[ak\u03C62] || (\u03C4T.disabled = \u03C4T[ak\u03C62] = \u03C5T);
      \u03B9T || !\u03C4T.setup || \u03C4T.setup(\u0394T);
      \u03C4T[\u03A8afterVisit10](\u0394T);
      \u03BA++;
    }
    ;
    \u03C4[\u03A8afterVisit10](\u03BA);
    ;
    \u03C4SELF[\u03A8afterReconcile10](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman-options", HangmanOptionsComponent, {});

// app/components/hangman/hangman-option.imba
var \u03A8beforeReconcile11 = Symbol.for("#beforeReconcile");
var \u03A8game7 = Symbol.for("#game");
var \u03A8placeChild6 = Symbol.for("#placeChild");
var \u03A8afterReconcile11 = Symbol.for("#afterReconcile");
var \u03B5SELF9 = Symbol();
var ag\u03C6 = Symbol();
var ah\u03C6 = Symbol();
var ai\u03C63 = Symbol();
var \u03B5i3 = Symbol();
var \u03B56 = Symbol();
use_events(), use_events_mouse();
var HangmanOptionComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  render() {
    var \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C5SELF, \u03B8SELF;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile11]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF9] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF9] = 1);
    \u03C5SELF = this.disabled || void 0, \u03C5SELF === \u03C4SELF[ah\u03C6] || (\u0394SELF |= 2, \u03C4SELF[ah\u03C6] = \u03C5SELF);
    \u03B8SELF = \u03C4SELF[ai\u03C63] || (\u03C4SELF[ai\u03C63] = {if: [null], emit: ["guess", null]});
    \u03B8SELF.if[0] = !this[\u03A8game7].over && !this.disabled;
    \u03B8SELF.emit[1] = this.option;
    \u03B9SELF || \u03C4SELF.on$(`mousedown`, \u03B8SELF, this);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("ei_ " + (\u03C4SELF[ah\u03C6] ? `disabled` : ""));
    \u03C5SELF = this.morse, \u03C5SELF === \u03C4SELF[\u03B56] && \u03B9SELF || (\u03C4SELF[\u03B5i3] = \u03C4SELF[\u03A8placeChild6](\u03C4SELF[\u03B56] = \u03C5SELF, 384, \u03C4SELF[\u03B5i3]));
    \u03C4SELF[\u03A8afterReconcile11](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman-option", HangmanOptionComponent, {});

// app/components/hangman/hangman-result.imba
var \u03A8beforeReconcile12 = Symbol.for("#beforeReconcile");
var \u03A8game8 = Symbol.for("#game");
var \u03A8\u03A8up7 = Symbol.for("##up");
var \u03A8placeChild7 = Symbol.for("#placeChild");
var \u03A8afterReconcile12 = Symbol.for("#afterReconcile");
var \u03B5SELF10 = Symbol();
var \u03B5T6 = Symbol();
var aj\u03C63 = Symbol();
var ak\u03C63 = Symbol();
var \u03B5i4 = Symbol();
var \u03B57 = Symbol();
var \u03B5T24 = Symbol();
var \u03B5i22 = Symbol();
var \u03B523 = Symbol();
var \u03B50\u03B92 = Symbol();
var \u03B51\u03B9 = Symbol();
var \u03B52\u03B9 = Symbol();
var \u03B53\u03B9 = Symbol();
var \u03B54\u03B9 = Symbol();
var HangmanResultComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  render() {
    var \u03C40if, \u03C41if, \u03C42if, \u03C43if, \u03C44if, \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C66 = this._ns_ || "", \u03B9T, \u0394T, \u03C5T, \u03B9T22, \u0394T22, \u03C5T2;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile12]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF10] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF10] = 1);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("ev_");
    \u03C40if = \u03C41if = \u03C42if = \u03C43if = \u03C44if = null;
    if (this[\u03A8game8].over) {
      \u03C40if = "You used ";
      (\u03B9T = \u0394T = 1, \u03C41if = \u03C4SELF[\u03B5T6]) || (\u03B9T = \u0394T = 0, \u03C4SELF[\u03B5T6] = \u03C41if = createElement("span", null, `ev-ag ev_ ${\u03C66}`, null));
      \u03B9T || (\u03C41if[\u03A8\u03A8up7] = \u03C4SELF);
      \u03C5T = this[\u03A8game8].guesses.length == this[\u03A8game8].options.length || void 0, \u03C5T === \u03C41if[ak\u03C63] || (\u0394T |= 2, \u03C41if[ak\u03C63] = \u03C5T);
      \u0394T & 2 && \u03C41if.flag$(`ev-ag ev_ ${\u03C66} ` + (\u03C41if[ak\u03C63] ? "ev-ah" : ""));
      \u03C5T = this[\u03A8game8].guesses.length, \u03C5T === \u03C41if[\u03B57] && \u03B9T || (\u03C41if[\u03B5i4] = \u03C41if[\u03A8placeChild7](\u03C41if[\u03B57] = \u03C5T, 384, \u03C41if[\u03B5i4]));
      \u03C42if = " out of the ";
      (\u03B9T22 = \u0394T22 = 1, \u03C43if = \u03C4SELF[\u03B5T24]) || (\u03B9T22 = \u0394T22 = 0, \u03C4SELF[\u03B5T24] = \u03C43if = createElement("span", null, `ev-ai ev_ ${\u03C66}`, null));
      \u03B9T22 || (\u03C43if[\u03A8\u03A8up7] = \u03C4SELF);
      \u03C5T2 = this[\u03A8game8].options.length, \u03C5T2 === \u03C43if[\u03B523] && \u03B9T22 || (\u03C43if[\u03B5i22] = \u03C43if[\u03A8placeChild7](\u03C43if[\u03B523] = \u03C5T2, 384, \u03C43if[\u03B5i22]));
      \u03C44if = " available letters";
    }
    ;
    \u03C4SELF[\u03B50\u03B92] = \u03C4SELF[\u03A8placeChild7](\u03C40if, 0, \u03C4SELF[\u03B50\u03B92]);
    \u03C4SELF[\u03B51\u03B9] = \u03C4SELF[\u03A8placeChild7](\u03C41if, 0, \u03C4SELF[\u03B51\u03B9]);
    \u03C4SELF[\u03B52\u03B9] = \u03C4SELF[\u03A8placeChild7](\u03C42if, 0, \u03C4SELF[\u03B52\u03B9]);
    \u03C4SELF[\u03B53\u03B9] = \u03C4SELF[\u03A8placeChild7](\u03C43if, 0, \u03C4SELF[\u03B53\u03B9]);
    \u03C4SELF[\u03B54\u03B9] = \u03C4SELF[\u03A8placeChild7](\u03C44if, 0, \u03C4SELF[\u03B54\u03B9]);
    \u03C4SELF[\u03A8afterReconcile12](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman-result", HangmanResultComponent, {});

// app/components/hangman/hangman-replay.imba
var \u03A8beforeReconcile13 = Symbol.for("#beforeReconcile");
var \u03A8game9 = Symbol.for("#game");
var \u03A8\u03A8up8 = Symbol.for("##up");
var \u03A8placeChild8 = Symbol.for("#placeChild");
var \u03A8afterReconcile13 = Symbol.for("#afterReconcile");
var \u03B5SELF11 = Symbol();
var \u03B5T7 = Symbol();
var \u03B50\u03B93 = Symbol();
use_events(), use_events_mouse();
var HangmanReplayComponent = class extends getSuperTagType("game-state", "GameStateComponent", Component) {
  render() {
    var \u03C40if, \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C66 = this._ns_ || "", \u03B9T, \u0394T;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile13]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF11] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF11] = 1);
    \u03B9SELF || \u03C4SELF.on$(`click`, {emit: ["replay"]}, this);
    (!\u03B9SELF || \u0394SELF & 2) && \u03C4SELF.flagSelf$("ej_");
    \u03C40if = null;
    if (this[\u03A8game9].over) {
      (\u03B9T = \u0394T = 1, \u03C40if = \u03C4SELF[\u03B5T7]) || (\u03B9T = \u0394T = 0, \u03C4SELF[\u03B5T7] = \u03C40if = createElement("div", null, `button ej_ ${\u03C66}`, "Play again"));
      \u03B9T || (\u03C40if[\u03A8\u03A8up8] = \u03C4SELF);
    }
    ;
    \u03C4SELF[\u03B50\u03B93] = \u03C4SELF[\u03A8placeChild8](\u03C40if, 0, \u03C4SELF[\u03B50\u03B93]);
    \u03C4SELF[\u03A8afterReconcile13](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("hangman-replay", HangmanReplayComponent, {});

// app/client.imba
var \u03A8beforeReconcile14 = Symbol.for("#beforeReconcile");
var \u03A8afterVisit11 = Symbol.for("#afterVisit");
var \u03A8appendChild6 = Symbol.for("#appendChild");
var \u03A8afterReconcile14 = Symbol.for("#afterReconcile");
var \u03A8\u03A8up9 = Symbol.for("##up");
var \u03B5SELF12 = Symbol();
var \u03B5T8 = Symbol();
var \u03C4T2;
var \u03F2\u03C4 = getRenderContext();
var \u03B5T25 = Symbol();
var \u03B9T2;
var \u0394T2;
var AppComponent = class extends Component {
  render() {
    var \u03C4SELF, \u03B9SELF, \u0394SELF, \u03C66 = this._ns_ || "", \u03C4T, \u03B9T, \u0394T;
    \u03C4SELF = this;
    \u03C4SELF[\u03A8beforeReconcile14]();
    (\u03B9SELF = \u0394SELF = 1, \u03C4SELF[\u03B5SELF12] === 1) || (\u03B9SELF = \u0394SELF = 0, \u03C4SELF[\u03B5SELF12] = 1);
    (\u03B9T = \u0394T = 1, \u03C4T = \u03C4SELF[\u03B5T8]) || (\u03B9T = \u0394T = 0, \u03C4SELF[\u03B5T8] = \u03C4T = createComponent("hangman", \u03C4SELF, `${\u03C66}`, null));
    \u03B9T || !\u03C4T.setup || \u03C4T.setup(\u0394T);
    \u03C4T[\u03A8afterVisit11](\u0394T);
    \u03B9T || \u03C4SELF[\u03A8appendChild6](\u03C4T);
    ;
    \u03C4SELF[\u03A8afterReconcile14](\u0394SELF);
    return \u03C4SELF;
  }
};
defineTag("app", AppComponent, {});
mount(((\u03B9T2 = \u0394T2 = 1, \u03C4T2 = \u03F2\u03C4[\u03B5T25]) || (\u03B9T2 = \u0394T2 = 0, \u03C4T2 = \u03F2\u03C4[\u03B5T25] = \u03C4T2 = createComponent("app", null, null, null)), \u03B9T2 || (\u03C4T2[\u03A8\u03A8up9] = \u03F2\u03C4._), \u03B9T2 || \u03F2\u03C4.sym || !\u03C4T2.setup || \u03C4T2.setup(\u0394T2), \u03F2\u03C4.sym || \u03C4T2[\u03A8afterVisit11](\u0394T2), \u03C4T2));
//__FOOT__
