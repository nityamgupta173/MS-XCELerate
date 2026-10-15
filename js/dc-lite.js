/*
 * dc-lite.js — a small standalone runtime for the prototype's .dc.html screens.
 *
 * The screens were authored in a design canvas whose own runtime is not part of
 * this repo. This file renders the same markup outside the canvas, using React:
 *   - {{ path }} holes (dotted lookups into renderVals())
 *   - <sc-if value="{{ x }}"> and <sc-for list="{{ xs }}" as="x">
 *   - onClick / onChange / onPointerDown handlers returned by renderVals()
 *   - class Component extends DCLogic { renderVals() { ... } }
 * It also scales the fixed-size screen to fit the browser window.
 */
(function () {
  'use strict';
  var h = React.createElement;
  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
  var EVENTS = { onclick: 'onClick', onchange: 'onChange', onpointerdown: 'onPointerDown', oninput: 'onInput' };
  var ATTRS = { 'class': 'className', 'for': 'htmlFor', autocomplete: 'autoComplete', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', inputmode: 'inputMode' };
  var HOLE = /\{\{\s*([^}\s]+)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}\s]+)\s*\}\}\s*$/;

  function lookup(scope, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(scope, p); return v == null ? '' : String(v); });
  }
  function value(str, scope) {
    var m = str.match(WHOLE);
    return m ? lookup(scope, m[1]) : interp(str, scope);
  }
  function styleObject(str) {
    var out = {};
    String(str).split(';').forEach(function (decl) {
      var i = decl.indexOf(':');
      if (i < 0) return;
      var k = decl.slice(0, i).trim(), v = decl.slice(i + 1).trim();
      if (!k) return;
      if (k.indexOf('--') !== 0) {
        k = k.replace(/^-(webkit|moz|ms)-/, function (_, p) { return p.charAt(0).toUpperCase() + p.slice(1) + '-'; })
             .replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      }
      out[k] = v;
    });
    return out;
  }

  function children(node, scope, key) {
    var out = [];
    var list = node.childNodes;
    for (var i = 0; i < list.length; i++) {
      var r = build(list[i], scope, key + '.' + i);
      if (r == null) continue;
      if (Array.isArray(r)) Array.prototype.push.apply(out, r); else out.push(r);
    }
    return out;
  }

  function build(node, scope, key) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (!/\S/.test(t) && /\n/.test(t)) return null; // formatting whitespace between tags
      return t.indexOf('{{') < 0 ? t : interp(t, scope);
    }
    if (node.nodeType !== 1) return null;
    var tag = node.tagName.toLowerCase();
    if (tag === 'helmet') return null;
    if (tag === 'sc-if') {
      return value(node.getAttribute('value') || '', scope) ? children(node, scope, key) : null;
    }
    if (tag === 'sc-for') {
      var items = value(node.getAttribute('list') || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      return items.map(function (it, i) {
        var s = Object.create(scope);
        s[as] = it; s.$index = i;
        return h.apply(null, [React.Fragment, { key: key + '-' + i }].concat(children(node, s, key + '-' + i)));
      });
    }
    var props = { key: key };
    for (var a = 0; a < node.attributes.length; a++) {
      var name = node.attributes[a].name, raw = node.attributes[a].value;
      if (name.indexOf('hint-') === 0) continue;
      if (EVENTS[name]) { props[EVENTS[name]] = value(raw, scope); continue; }
      var v = value(raw, scope);
      if (name === 'style') { props.style = styleObject(v); continue; }
      name = ATTRS[name] || name;
      if (name === 'checked' || name === 'disabled') { props[name] = v === true || v === 'true' || v === name; continue; }
      if (name.indexOf('aria-') === 0 && typeof v === 'boolean') v = String(v);
      props[name] = v;
    }
    if (tag === 'input' && 'checked' in props && !props.onChange) props.readOnly = true;
    if (VOID[tag]) return h(tag, props);
    return h.apply(null, [tag, props].concat(children(node, scope, key)));
  }

  function mount() {
    var tpl = document.getElementById('dc-template');
    var scriptEl = document.querySelector('script[data-dc-script]');
    var meta = JSON.parse(scriptEl.getAttribute('data-props') || '{}');
    var defaults = {};
    Object.keys(meta).forEach(function (k) { if (k.charAt(0) !== '$' && meta[k] && 'default' in meta[k]) defaults[k] = meta[k]['default']; });
    var W = (meta.$preview && meta.$preview.width) || 1080;
    var H = (meta.$preview && meta.$preview.height) || 1920;

    function DCLogic(props) { React.Component.call(this, props); }
    DCLogic.prototype = Object.create(React.Component.prototype);
    DCLogic.prototype.constructor = DCLogic;
    DCLogic.prototype.render = function () {
      var vals = this.renderVals();
      var scope = Object.assign(Object.create(null), vals);
      return h.apply(null, [React.Fragment, null].concat(children(tpl.content, scope, 'r')));
    };
    var Component = new Function('DCLogic', 'React', scriptEl.textContent + '\n;return Component;')(DCLogic, React);

    var stage = document.getElementById('dc-stage');
    stage.style.width = W + 'px';
    stage.style.height = H + 'px';
    function fit() {
      var s = Math.min(window.innerWidth / W, window.innerHeight / H);
      stage.style.transform = 'scale(' + s + ')';
      var all = document.getElementById('dc-all');
      if (all) all.style.display = (window.innerWidth - W * s) / 2 >= 130 ? '' : 'none';
    }
    window.addEventListener('resize', fit);
    fit();
    ReactDOM.createRoot(stage).render(h(Component, defaults));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
