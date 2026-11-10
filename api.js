// Адаптер серверной части (Google Apps Script). Чтобы позже перейти на другой бэкенд, достаточно переписать только этот файл.
(function (root) {
  var K = 'zp_tok';
  function enabled() { return !!(root.CFG && root.CFG.api); }
  function netErr() { var e = new Error('Не удалось связаться с сервером'); e.code = 'net'; return e; }
  async function call(action, data) {
    var r, j;
    try { r = await fetch(root.CFG.api, { method: 'POST', body: JSON.stringify(Object.assign({ action: action, token: localStorage[K] || '' }, data || {})) }); }
    catch (e) { throw netErr(); }
    try { j = await r.json(); } catch (e) { throw netErr(); }
    if (!j.ok) { var er = new Error(j.error || 'Ошибка сервера'); er.code = j.code || ''; throw er; }
    return j;
  }
  root.Api = {
    enabled: enabled,
    token: function () { return localStorage[K] || ''; },
    clear: function () { delete localStorage[K]; },
    login: async function (email, password) { var j = await call('login', { email: email, password: password }); localStorage[K] = j.token; return j; },
    register: async function (email, password, invite) { var j = await call('register', { email: email, password: password, invite: invite }); localStorage[K] = j.token; return j; },
    logout: async function () { try { await call('logout'); } catch (e) { } delete localStorage[K]; },
    boot: function () { return call('boot'); },
    save: function (entry) { return call(entry.id ? 'update' : 'add', { entry: entry }); },
    remove: function (id) { return call('delete', { id: id }); },
    importAll: function (entries) { return call('import', { entries: entries }); },
    saveSettings: function (settings) { return call('saveSettings', { settings: settings }); }
  };
})(this);
