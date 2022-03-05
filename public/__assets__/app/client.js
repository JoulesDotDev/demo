
// node_modules/imba/src/imba/utils.imba
var $23 = Symbol.for("#__initor__");
var $24 = Symbol.for("#__inited__");
var $1 = Symbol.for("#__hooks__");
var $2 = Symbol.for("#type");
var $21 = Symbol.for("#__listeners__");
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
function emit(obj, event, params) {
  let cb;
  if (cb = obj[$21]) {
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
var $12 = Symbol.for("#__init__");
var $17 = Symbol.for("#__initor__");
var $18 = Symbol.for("#__inited__");
var $22 = Symbol.for("#__hooks__");
var $3 = Symbol.for("#schedule");
var $5 = Symbol.for("#frames");
var $6 = Symbol.for("#interval");
var $7 = Symbol.for("#stage");
var $8 = Symbol.for("#scheduled");
var $9 = Symbol.for("#version");
var $10 = Symbol.for("#fps");
var $11 = Symbol.for("#ticker");
var rAF = globalThis.requestAnimationFrame || function(blk) {
  return globalThis.setTimeout(blk, 1e3 / 60);
};
var SPF = 1 / 60;
var Scheduled = class {
  constructor($$ = null) {
    this[$12]($$);
  }
  [$12]($$ = null) {
    var $48;
    this.owner = $$ && ($48 = $$.owner) !== void 0 ? $48 : null;
    this.target = $$ && ($48 = $$.target) !== void 0 ? $48 : null;
    this.active = $$ && ($48 = $$.active) !== void 0 ? $48 : false;
    this.value = $$ && ($48 = $$.value) !== void 0 ? $48 : void 0;
    this.skip = $$ && ($48 = $$.skip) !== void 0 ? $48 : 0;
    this.last = $$ && ($48 = $$.last) !== void 0 ? $48 : 0;
  }
  tick(scheduler2, source) {
    this.last = this.owner[$5];
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
        this[$6] = globalThis.setInterval(this.queue.bind(this), this.value);
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
    if (this[$6]) {
      globalThis.clearInterval(this[$6]);
      this[$6] = null;
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
    this[$7] = -1;
    this[$5] = 0;
    this[$8] = false;
    this[$9] = 0;
    this.listeners = {};
    this.intervals = {};
    self.commit = function() {
      self.add("commit");
      return self;
    };
    this[$10] = 0;
    self.$promise = null;
    self.$resolve = null;
    this[$11] = function(e) {
      self[$8] = false;
      return self.tick(e);
    };
    self;
  }
  touch() {
    return this[$9]++;
  }
  get version() {
    return this[$9];
  }
  add(item, force) {
    if (force || this.queue.indexOf(item) == -1) {
      this.queue.push(item);
    }
    ;
    if (!this[$8]) {
      this[$3]();
    }
    ;
    return this;
  }
  get committing\u03A6() {
    return this.queue.indexOf("commit") >= 0;
  }
  get syncing\u03A6() {
    return this[$7] == 1;
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
    var $125;
    let set = this.listeners[ns];
    set && set.delete(item);
    if (ns == "raf" && set && set.size == 0) {
      $125 = this.listeners.raf, delete this.listeners.raf, $125;
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
    let frame = this[$5]++;
    if (!this.ts) {
      this.ts = timestamp;
    }
    ;
    this.dt = timestamp - this.ts;
    this.ts = timestamp;
    this.queue = [];
    this[$7] = 1;
    this[$9]++;
    if (items.length) {
      for (let i = 0, $134 = iter$__(items), $144 = $134.length; i < $144; i++) {
        let item = $134[i];
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
    this[$7] = this[$8] ? 0 : -1;
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
  [$3]() {
    if (!this[$8]) {
      this[$8] = true;
      if (this[$7] == -1) {
        this[$7] = 0;
      }
      ;
      rAF(this[$11]);
    }
    ;
    return this;
  }
  schedule(item, o) {
    var $154, $164;
    o || (o = item[$154 = this.id] || (item[$154] = {value: true}));
    let state = o[$164 = this.id] || (o[$164] = new Scheduled({owner: this, target: item}));
    return state.update(o, true);
  }
  unschedule(item, o = {}) {
    o || (o = item[this.id]);
    let state = o && o[this.id];
    if (state && state.active) {
      state.deactivate();
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
function setInterval(fn, ms) {
  return globalThis.setInterval(function() {
    fn();
    commit();
    return;
  }, ms);
}
var clearInterval = globalThis.clearInterval;
var clearTimeout = globalThis.clearTimeout;
var instance = globalThis.imba || (globalThis.imba = {});
instance.commit = commit;
instance.setTimeout = setTimeout2;
instance.setInterval = setInterval;
instance.clearInterval = clearInterval;
instance.clearTimeout = clearTimeout;

// node_modules/imba/src/imba/manifest.web.imba
var $25 = Symbol.for("#__initor__");
var $32 = Symbol.for("#__inited__");
var $13 = Symbol.for("#__hooks__");
var Manifest = class {
  constructor() {
    this.data = {};
  }
};
var manifest = new Manifest();

// node_modules/imba/src/imba/asset.imba
var $112 = Symbol.for("#__initor__");
var $122 = Symbol.for("#__inited__");
var $14 = Symbol.for("#__hooks__");
var $26 = Symbol.for("#__init__");
var $33 = Symbol.for("#warned");
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
      if (this.meta[$33] != true ? (this.meta[$33] = true, true) : false) {
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
    this[$26]($$);
  }
  [$26]($$ = null) {
    this.url = $$ ? $$.url : void 0;
    this.meta = $$ ? $$.meta : void 0;
  }
  adoptNode(node) {
    var _a;
    if ((_a = this.meta) == null ? void 0 : _a.content) {
      for (let $65 = this.meta.attributes, $48 = 0, $57 = Object.keys($65), $75 = $57.length, k, v; $48 < $75; $48++) {
        k = $57[$48];
        v = $65[k];
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
  var $94, $103;
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

// node_modules/imba/src/imba/dom/flags.imba
var $15 = Symbol.for("#toStringDeopt");
var $72 = Symbol.for("#__initor__");
var $83 = Symbol.for("#__inited__");
var $27 = Symbol.for("#__hooks__");
var $34 = Symbol.for("#symbols");
var $4 = Symbol.for("#batches");
var $52 = Symbol.for("#extras");
var $62 = Symbol.for("#stacks");
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
    let syms = this[$34];
    let vals = this[$4];
    let dirty = true;
    if (!syms) {
      syms = this[$34] = [sym];
      vals = this[$4] = [str || ""];
      this.toString = this.valueOf = this[$15];
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
      this[$52] = " " + vals.join(" ");
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
  [$15]() {
    return this.string + (this[$52] || "");
  }
  sync() {
    return this.dom.flagSync$();
  }
  get stacks() {
    return this[$62] || (this[$62] = {});
  }
};

// node_modules/imba/src/imba/dom/context.imba
var $16 = Symbol.for("#__init__");
var $63 = Symbol.for("#__initor__");
var $73 = Symbol.for("#__inited__");
var $28 = Symbol.for("#__hooks__");
var $35 = Symbol.for("#getRenderContext");
var $42 = Symbol.for("#getDynamicContext");
var $53 = Symbol();
var renderContext = {
  context: null
};
var Renderer = class {
  constructor($$ = null) {
    this[$16]($$);
  }
  [$16]($$ = null) {
    var $85;
    this.stack = $$ && ($85 = $$.stack) !== void 0 ? $85 : [];
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
  static [$16]() {
    this.prototype[$63] = $53;
    return this;
  }
  constructor(parent, sym = null) {
    super();
    this._ = parent;
    this.sym = sym;
    this[$63] === $53 && (this[$28] && this[$28].inited(this), this[$73] && this[$73]());
  }
  pop() {
    return renderContext.context = null;
  }
  [$35](sym) {
    let out = this.get(sym);
    out || this.set(sym, out = new RenderContext(this._, sym));
    return renderContext.context = out;
  }
  [$42](sym, key) {
    return this[$35](sym)[$35](key);
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
RenderContext[$16]();
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
var $19 = Symbol.for("#parent");
var $29 = Symbol.for("#closestNode");
var $36 = Symbol.for("#parentNode");
var $43 = Symbol.for("#context");
var $54 = Symbol.for("#__init__");
var $64 = Symbol.for("##inited");
var $74 = Symbol.for("#getRenderContext");
var $84 = Symbol.for("#getDynamicContext");
var $92 = Symbol.for("#insertChild");
var $102 = Symbol.for("#appendChild");
var $113 = Symbol.for("#replaceChild");
var $123 = Symbol.for("#removeChild");
var $132 = Symbol.for("#insertInto");
var $142 = Symbol.for("#insertIntoDeopt");
var $152 = Symbol.for("#removeFrom");
var $162 = Symbol.for("#removeFromDeopt");
var $172 = Symbol.for("#replaceWith");
var $182 = Symbol.for("#replaceWithDeopt");
var $192 = Symbol.for("#placeholderNode");
var $20 = Symbol.for("#attachToParent");
var $212 = Symbol.for("#detachFromParent");
var $222 = Symbol.for("#placeChild");
var $232 = Symbol.for("#beforeReconcile");
var $242 = Symbol.for("#afterReconcile");
var $252 = Symbol.for("#afterVisit");
var $262 = Symbol.for("##parent");
var $272 = Symbol.for("##up");
var $282 = Symbol.for("##context");
var $292 = Symbol.for("#domNode");
var $30 = Symbol.for("##placeholderNode");
var $31 = Symbol.for("#domDeopt");
var $322 = Symbol.for("#isRichElement");
var $342 = Symbol.for("#src");
var $422 = Symbol.for("#htmlNodeName");
var $432 = Symbol.for("#getSlot");
var $44 = Symbol.for("#ImbaElement");
var $45 = Symbol.for("#cssns");
var $46 = Symbol.for("#cssid");
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
      if (ctx = ctx[$19]) {
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
        ctx = ctx[$19];
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
  get [$19]() {
    return this[$262] || this.parentNode || this[$272];
  }
  get [$29]() {
    return this;
  }
  get [$36]() {
    return this[$19][$29];
  }
  get [$43]() {
    return this[$282] || (this[$282] = new Proxy(this, contextHandler));
  }
  [$54]() {
    return this;
  }
  [$64]() {
    return this;
  }
  [$74](sym) {
    return createRenderContext(this, sym);
  }
  [$84](sym, key) {
    return this[$74](sym)[$74](key);
  }
  [$92](newnode, refnode) {
    return newnode[$132](this, refnode);
  }
  [$102](newnode) {
    return newnode[$132](this, null);
  }
  [$113](newnode, oldnode) {
    let res = this[$92](newnode, oldnode);
    this[$123](oldnode);
    return res;
  }
  [$123](node) {
    return node[$152](this);
  }
  [$132](parent, before = null) {
    if (before) {
      parent.insertBefore(this, before);
    } else {
      parent.appendChild(this);
    }
    ;
    return this;
  }
  [$142](parent, before) {
    if (before) {
      parent.insertBefore(this[$292] || this, before);
    } else {
      parent.appendChild(this[$292] || this);
    }
    ;
    return this;
  }
  [$152](parent) {
    return parent.removeChild(this);
  }
  [$162](parent) {
    return parent.removeChild(this[$292] || this);
  }
  [$172](other, parent) {
    return parent[$113](other, this);
  }
  [$182](other, parent) {
    return parent[$113](other, this[$292] || this);
  }
  get [$192]() {
    return this[$30] || (this[$30] = globalThis.document.createComment("placeholder"));
  }
  set [$192](value) {
    let prev = this[$30];
    this[$30] = value;
    if (prev && prev != value && prev.parentNode) {
      prev[$172](value);
    }
    ;
  }
  [$20]() {
    let ph = this[$292];
    let par = ph && ph.parentNode;
    if (ph && par && ph != this) {
      this[$292] = null;
      this[$132](par, ph);
      ph[$152](par);
    }
    ;
    return this;
  }
  [$212]() {
    if (this[$31] != true ? (this[$31] = true, true) : false) {
      this[$172] = this[$182];
      this[$152] = this[$162];
      this[$132] = this[$142];
    }
    ;
    let ph = this[$192];
    if (this.parentNode && ph != this) {
      ph[$132](this.parentNode, this);
      this[$152](this.parentNode);
    }
    ;
    this[$292] = ph;
    return this;
  }
  [$222](item, f, prev) {
    let type = typeof item;
    if (type === "undefined" || item === null) {
      if (prev && prev instanceof Comment) {
        return prev;
      }
      ;
      let el = globalThis.document.createComment("");
      return prev ? prev[$172](el, this) : el[$132](this, null);
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
          prev[$172](res, this);
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
        if (!item[$132]) {
          console.warn("Tried to insert", item, "into", this);
          throw new TypeError("Only DOM Nodes can be inserted into DOM");
        }
        ;
      }
      ;
      return prev ? prev[$172](item, this) : item[$132](this, null);
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
  [$232]() {
    return this;
  }
  [$242]() {
    return this;
  }
  [$252]() {
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
Element.prototype[$322] = true;
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
  if (parent && parent[$102]) {
    parent[$102](el);
  }
  ;
  return el;
}
var Extend$SVGElement$ai = class {
  set$(key, value) {
    var $332;
    let cache = descriptorCache[$332 = this.nodeName] || (descriptorCache[$332] = {});
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
    if (this[$342] != value ? (this[$342] = value, true) : false) {
      if (value) {
        if (value.adoptNode) {
          value.adoptNode(this);
        } else if (value.content) {
          for (let $372 = value.attributes, $352 = 0, $362 = Object.keys($372), $38 = $362.length, k, v; $352 < $38; $352++) {
            k = $362[$352];
            v = $372[k];
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
function createSVGElement(name, parent, flags, text, ctx) {
  let el = globalThis.document.createElementNS("http://www.w3.org/2000/svg", name);
  if (flags) {
    el.className.baseVal = flags;
  }
  ;
  if (parent && parent[$102]) {
    parent[$102](el);
  }
  ;
  if (text) {
    el.textContent = text;
  }
  ;
  return el;
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
    for (let $39 = 0, $40 = iter$__2(protos), $41 = $40.length; $39 < $41; $39++) {
      let item = $40[$39];
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
    let typ = cls.prototype[$422];
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
  el[$262] = parent;
  el[$54]();
  el[$64]();
  if (text !== null) {
    el[$432]("__").text$(text);
  }
  ;
  if (flags || el.flags$ns) {
    el.flag$(flags || "");
  }
  ;
  return el;
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
    let ns = (proto._ns_ || proto[$45] || "") + " " + (options.cssns || "");
    proto._ns_ = ns.trim() + " ";
    proto[$45] = options.cssns;
  }
  ;
  if (options.cssid) {
    let ids = (proto.flags$ns || "") + " " + options.cssid;
    proto[$46] = options.cssid;
    proto.flags$ns = ids.trim() + " ";
  }
  ;
  if (proto[$422] && !options.extends) {
    options.extends = proto[$422];
  }
  ;
  if (options.extends) {
    proto[$422] = options.extends;
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

// node_modules/imba/src/imba/dom/component.imba
function iter$__3(a) {
  let v;
  return a ? (v = a.toIterable) ? v.call(a) : a : [];
}
var $110 = Symbol.for("#__init__");
var $210 = Symbol.for("##inited");
var $37 = Symbol.for("#afterVisit");
var $47 = Symbol.for("#beforeReconcile");
var $55 = Symbol.for("#afterReconcile");
var $93 = Symbol.for("#count");
var $133 = Symbol.for("#__hooks__");
var $143 = Symbol.for("#autorender");
var hydrator = new class {
  constructor($$ = null) {
    this[$110]($$);
  }
  [$110]($$ = null) {
    var $65;
    this.items = $$ && ($65 = $$.items) !== void 0 ? $65 : [];
    this.current = $$ && ($65 = $$.current) !== void 0 ? $65 : null;
    this.lastQueued = $$ && ($65 = $$.lastQueued) !== void 0 ? $65 : null;
    this.tests = $$ && ($65 = $$.tests) !== void 0 ? $65 : 0;
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
    var $125, $103;
    if (this.active) {
      return;
    }
    ;
    this.active = true;
    let all = globalThis.document.querySelectorAll(".__ssr");
    console.log("running hydrator", item, all.length, Array.from(all));
    for (let $75 = 0, $85 = iter$__3(all), $115 = $85.length; $75 < $115; $75++) {
      let item2 = $85[$75];
      item2[$93] || (item2[$93] = 1);
      item2[$93]++;
      let name = item2.nodeName;
      let typ = ($103 = this.map)[name] || ($103[name] = globalThis.window.customElements.get(name.toLowerCase()) || HTMLElement);
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
  constructor() {
    super();
    if (this.flags$ns) {
      this.flag$ = this.flagExt$;
    }
    ;
    this.setup$();
    this.build();
  }
  setup$() {
    this.__slots = {};
    return this.__F = 0;
  }
  [$110]() {
    this.__F |= 1 | 2;
    return this;
  }
  [$210]() {
    if (this[$133]) {
      return this[$133].inited(this);
    }
    ;
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
    let o = this[$143] || (this[$143] = {});
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
  [$37]() {
    return this.visit();
  }
  [$47]() {
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
  [$55]() {
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
      this[$110]();
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
    emit(this, "mount");
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
    if (this[$143]) {
      scheduler.schedule(this, this[$143]);
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
    emit(this, "unmount");
    this.unmount();
    if (this[$143]) {
      return scheduler.unschedule(this, this[$143]);
    }
    ;
  }
};

// node_modules/imba/src/imba/dom/mount.imba
var $111 = Symbol.for("#insertInto");
var $211 = Symbol.for("#removeFrom");
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
  element[$111](parent);
  return element;
}
function unmount(el) {
  if (el && el[$211]) {
    el[$211](el.parentNode);
  }
  ;
  return el;
}
var instance3 = globalThis.imba || (globalThis.imba = {});
instance3.mount = mount;
instance3.unmount = unmount;

// app/logo.svg
var logo_default = "/__assets__/logo-QVLCUDGZ.svg"         ;

// img:app/logo.svg
var logo_default2 = /* @__PURE__ */ asset({
  url: logo_default,
  type: "svg",
  meta: {attributes: {viewBox: "0 0 1164 400", "fill-rule": "evenodd", "clip-rule": "evenodd", "stroke-linejoin": "round", "stroke-miterlimit": "2"}, flags: [], content: '\r\n  <path fill="none" d="M.658 0h1163v400H.658z"/>\r\n  <g fill="#273240">\r\n    <path d="M410.808 338.269c-3.618 0-6.551-2.932-6.551-6.55V159.88c0-3.618 2.933-6.55 6.551-6.55h41.928c3.618 0 6.55 2.932 6.551 6.55v171.839c-.001 3.618-2.933 6.55-6.551 6.55h-41.928z" fill-rule="nonzero"/>\r\n    <ellipse cx="431.598" cy="87.156" rx="32.391" ry="31.346"/>\r\n    <path d="M696.469 147.409c14.628 0 26.353 4.934 35.177 14.802 8.823 9.868 13.234 23.509 13.234 40.923v128.585c0 1.737-.69 3.403-1.918 4.632-1.229 1.228-2.895 1.918-4.632 1.918h-41.928c-1.738 0-3.404-.69-4.632-1.918-1.229-1.229-1.919-2.895-1.919-4.632V212.538c0-16.485-5.224-24.728-15.672-24.728-5.805 0-10.913 1.974-15.325 5.921-2.287 2.046-4.543 4.654-6.768 7.824-3.831 5.193-5.898 11.476-5.898 17.929-.221 22.92-.221 90.816-.221 112.235 0 1.737-.69 3.403-1.918 4.632-1.229 1.228-2.895 1.918-4.632 1.918h-41.928c-1.738 0-3.404-.69-4.632-1.918-1.229-1.229-1.919-2.895-1.919-4.632V212.538c0-16.485-5.224-24.728-15.672-24.728-5.573 0-10.623 2.032-15.151 6.095-2.67 2.396-5.279 5.458-7.828 9.187-3.292 4.656-5.06 10.219-5.06 15.921-.173 22.446-.173 91.138-.173 112.706 0 1.737-.69 3.403-1.918 4.632-1.229 1.228-2.895 1.918-4.632 1.918h-41.928c-3.618 0-6.551-2.932-6.551-6.55V159.88c0-3.618 2.933-6.55 6.551-6.55h36.022c3.176 0 5.895 2.278 6.45 5.406.448 2.526.99 5.582 1.482 8.355.25 1.4 1.273 2.537 2.638 2.934 1.366.397 2.839-.016 3.8-1.064 5.811-6.348 12.085-11.264 18.809-14.761 8.708-4.527 18.634-6.791 29.779-6.791 10.216 0 19.097 2.554 26.644 7.662 4.629 3.134 9.936 10.55 13.347 15.815.911 1.316 2.356 2.163 3.95 2.314 1.594.151 3.173-.41 4.315-1.532 5.347-5.413 14.008-13.767 19.834-16.945 8.939-4.876 19.213-7.314 30.823-7.314zM879.667 147.409c22.522 0 39.762 8.591 51.72 25.773 11.958 17.182 17.937 41.446 17.937 72.792 0 19.039-2.961 35.989-8.881 50.849-5.921 14.86-14.396 26.47-25.425 34.829-11.029 8.359-24.09 12.538-39.182 12.538-10.217 0-19.446-2.032-27.689-6.095-4.643-2.289-8.863-5.149-12.659-8.58-1.633-1.48-3.946-1.945-6.024-1.211s-3.587 2.549-3.928 4.726c-.075-.008-.076-.004-.076 0-.474 3.016-3.072 5.239-6.126 5.239h-36.906c-3.617 0-6.55-2.932-6.55-6.55V85.725c0-3.346 2.522-6.155 5.849-6.513 10.128-1.09 30.901-3.325 41.929-4.511 1.848-.199 3.694.397 5.078 1.639 1.383 1.243 2.173 3.014 2.173 4.874v79.057c.001 1.814 1.077 3.454 2.741 4.177 1.663.723 3.597.39 4.923-.847 3.916-3.649 8.454-6.77 13.581-9.401 8.824-4.527 17.995-6.791 27.515-6.791zm-19.504 156.728c21.361 0 32.042-19.388 32.042-58.163 0-21.826-2.554-36.977-7.662-45.452-5.108-8.475-12.422-12.712-21.942-12.712-7.693 0-14.643 2.71-20.849 8.128-6.84 6.025-10.759 14.699-10.759 23.814-.086 14.5-.086 40.738-.086 55.477.002 15.709 12.536 28.549 28.241 28.928.337-.024.675-.02 1.015-.02zM1120.33 284.633c0 6.966.987 12.074 2.96 15.325 1.242 2.045 2.966 3.768 5.172 5.17 2.416 1.577 3.481 4.575 2.6 7.323-.726 2.723-1.834 6.183-2.995 9.808-2.184 6.819-7.312 12.298-13.971 14.929-6.659 2.631-14.147 2.136-20.402-1.349-.002-.004-.005-.006-.008-.008-7.082-3.947-12.712-10.332-16.892-19.155-12.074 18.343-30.649 27.514-55.725 27.514-18.343 0-32.971-5.34-43.884-16.021-10.913-10.681-16.37-24.612-16.37-41.794 0-20.201 7.43-35.641 22.291-46.322 14.86-10.681 36.337-16.021 64.432-16.021h11.861c1.843 0 3.609-.732 4.912-2.035 1.303-1.303 2.035-3.069 2.035-4.912v-1.064c0-10.913-2.322-18.401-6.966-22.464-4.644-4.064-12.77-6.095-24.38-6.095-6.037 0-13.351.87-21.942 2.612-6.675 1.353-13.491 3.092-20.447 5.216-3.371 1.036-6.957-.784-8.11-4.117-2.316-6.679-6.021-17.383-8.341-24.086-1.182-3.411.619-7.135 4.026-8.327 9.659-3.329 19.512-5.954 29.563-7.868 12.19-2.322 23.51-3.483 33.958-3.483 26.47 0 45.858 5.456 58.164 16.369 12.306 10.913 18.459 27.283 18.459 49.108v71.747zm-83.24 20.201c6.037 0 11.551-1.509 16.543-4.528h.001c7.89-4.771 12.712-13.32 12.712-22.54v-15.98c0-4.117-3.337-7.453-7.453-7.453h-6.13c-12.539 0-21.884 2.205-28.037 6.617-6.153 4.412-9.23 11.261-9.23 20.549 0 7.43 1.916 13.177 5.747 17.24 3.831 4.063 9.113 6.095 15.847 6.095z" fill-rule="nonzero"/>\r\n  </g>\r\n  <path d="M360.039 167.628C323.834 99.341.596 29.568 35.591 74.7c34.995 45.132 190.036 107.062 199.223 108.212-47.568 14.937-174.53 41.73-147.353 64.299 27.177 22.569 156.265-2.637 156.052-2.236-35.746 26.937-80.254 108.258-35.536 90.883 70.555-27.413 173.158-128.44 152.062-168.23z" fill="#16cec7"/>\r\n'},
  toString: function() {
    return this.url;
  }
});

// app/client.imba
var $213 = Symbol.for("#beforeReconcile");
var $124 = Symbol.for("#placeChild");
var $153 = Symbol.for("#afterReconcile");
var $214 = Symbol.for("##up");
var $223 = Symbol.for("#afterVisit");
var $56 = Symbol();
var $114 = Symbol();
var $163;
var $173 = getRenderContext();
var $183 = Symbol();
var $193;
var $202;
var AppComponent = class extends Component {
  render() {
    var $115, $38, $48, $65 = this._ns_ || "", $75, $85, $103, $134, $144;
    $115 = this;
    $115[$213]();
    ($38 = $48 = 1, $115[$56] === 1) || ($38 = $48 = 0, $115[$56] = 1);
    $38 || ($75 = createElement("header", $115, `${$65}`, null));
    $38 || ($85 = createSVGElement("svg", $75, `ci-ah ${$65}`, null));
    $38 || $85.set$("src", logo_default2);
    ;
    ($103 = $115[$114]) || ($115[$114] = $103 = createElement("p", $75, `${$65}`, null));
    $38 || $103[$124]("Edit ");
    $38 || ($134 = createElement("code", $103, `${$65}`, "app/client.imba"));
    ;
    $38 || $103[$124](" and save to reload");
    ;
    $38 || ($144 = createElement("a", $75, `${$65}`, "Learn Imba"));
    $38 || ($144.href = "https://imba.io");
    ;
    ;
    $115[$153]($48);
    return $115;
  }
};
defineTag("app", AppComponent, {});
mount((($193 = $202 = 1, $163 = $173[$183]) || ($193 = $202 = 0, $163 = $173[$183] = $163 = createComponent("app", null, null, null)), $193 || ($163[$214] = $173._), $193 || $173.sym || !$163.setup || $163.setup($202), $173.sym || $163[$223]($202), $163));
//__FOOT__
