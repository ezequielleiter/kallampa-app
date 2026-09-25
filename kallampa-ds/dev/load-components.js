/* Carga los componentes .jsx sin bundle (vista previa local o Claude Code sin build).
   Si ya existe un bundle con los componentes, no hace nada. Expone window.KallampaDS y window.kallampaReady. */
(function () {
  var base = document.currentScript.src.replace(/dev\/load-components\.js.*$/, 'components/');
  var ORDER = ['core/Tag', 'core/StatusTag', 'core/StatusDot', 'core/Button', 'core/IconButton', 'core/Logo',
    'forms/Field', 'forms/Input', 'forms/Select', 'forms/Textarea', 'forms/Checkbox', 'forms/SegmentedControl', 'forms/ChoiceList', 'forms/StateSelect',
    'data/Table', 'data/ProgressDays', 'data/Kpi', 'data/Stepper', 'data/CostBreakdown',
    'layout/Card', 'layout/SectionCard', 'layout/PendingList',
    'navigation/Sidebar', 'navigation/Topbar',
    'overlay/Dialog', 'overlay/Drawer', 'overlay/Menu', 'overlay/Toast'];
  var found = null;
  Object.keys(window).some(function (k) { try { var v = window[k]; if (v && typeof v === 'object' && v.StatusTag && v.Button) { found = v; return true; } } catch (e) {} return false; });
  if (found) { window.KallampaDS = found; window.kallampaReady = Promise.resolve(found); return; }
  var NS = window.KallampaDS = {};
  window.kallampaReady = Promise.all(ORDER.map(function (p) { return fetch(base + p + '.jsx').then(function (r) { return r.text(); }); }))
    .then(function (srcs) {
      srcs.forEach(function (src) {
        var names = []; src.replace(/export function (\w+)/g, function (_, n) { names.push(n); });
        var code = src.replace(/^import .*$/mg, '').replace(/export function /g, 'function ');
        code = Babel.transform(code, { presets: ['react'] }).code;
        var keys = Object.keys(NS);
        var out = new Function(['React'].concat(keys).join(','), code + '\nreturn {' + names.join(',') + '};')
          .apply(null, [React].concat(keys.map(function (k) { return NS[k]; })));
        Object.assign(NS, out);
      });
      return NS;
    });
})();
