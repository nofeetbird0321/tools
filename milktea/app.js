'use strict';
(() => {
  const D = window.TeaData;
  const $ = id => document.getElementById(id);
  const money = cents => (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let records = [], year = new Date().getFullYear(), limit = 20, pendingDelete = null, timer;
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  function toast(message) { clearTimeout(timer); $('toast').textContent = message; $('toast').hidden = false; timer = setTimeout(() => { $('toast').hidden = true; }, 3500); }
  function read() { const raw = localStorage.getItem(D.KEY); return raw === null ? [] : D.parse(raw); }
  function storageError() {
    $('storage-warning').textContent = '无法读取或保存本地记录。请保留当前浏览器数据，并尝试导出备份；不要清除网站数据。';
    $('storage-warning').hidden = false;
    $('entry-form').querySelector('[type=submit]').disabled = true;
  }
  function commit(transform) {
    try { const latest = read(); const next = transform(latest); localStorage.setItem(D.KEY, D.pack(next)); records = next; $('storage-warning').hidden = true; $('entry-form').querySelector('[type=submit]').disabled = false; render(); return true; }
    catch (error) { toast(error.message || '保存失败，请先备份记录。'); return false; }
  }
  function refresh() { try { records = read(); $('storage-warning').hidden = true; $('entry-form').querySelector('[type=submit]').disabled = false; } catch { storageError(); } render(); }
  function render() {
    const stats = D.summarize(records, year);
    const availableYears = [...new Set([new Date().getFullYear(), year, ...records.map(record => Number(record.date.slice(0, 4)))])].sort((a, b) => b - a);
    $('year').replaceChildren(...availableYears.map(y => { const option = el('option', '', `${y} 年`); option.value = y; option.selected = y === year; return option; }));
    $('year-total').textContent = money(stats.total); $('all-total').textContent = money(stats.all); $('year-count').textContent = stats.count;
    $('summary-note').textContent = stats.count ? `这 ${stats.count} 次选择，都在给未来的自己留一点余地。` : '从第一杯开始，小小的积累也值得被看见。';
    $('month-total').textContent = money(stats.currentMonth === null ? Math.round(stats.total / 12) : stats.currentMonth);
    $('month-label').textContent = stats.currentMonth === null ? '月均省下（全年 12 月）' : '本月省下';
    const max = Math.max(...stats.months, 1);
    $('monthly-chart').replaceChildren(...stats.months.map((amount, index) => {
      const active = year === new Date().getFullYear() && index === new Date().getMonth();
      const column = el('div', `month-column${active ? ' current' : ''}${amount ? '' : ' empty'}`);
      column.tabIndex = 0; column.dataset.tip = `${index + 1} 月 · ¥${money(amount)}`; column.setAttribute('aria-label', column.dataset.tip);
      const space = el('div', 'bar-space'), bar = el('div', 'bar'); bar.style.height = `${Math.max(3, amount / max * 100)}%`; space.append(bar);
      column.append(space, el('span', 'month-label', `${index + 1}月`)); return column;
    }));
    const filtered = records.filter(record => Number(record.date.slice(0, 4)) === year).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    $('record-count').textContent = `${year} 年 · ${filtered.length} 笔`;
    if (!filtered.length) {
      const empty = el('div', 'empty-state'); empty.append(el('span', '', '一杯的改变，也算开始。'), el('div', '', '记下第一次没买的奶茶，让积累从今天发生。')); $('record-list').replaceChildren(empty);
    } else $('record-list').replaceChildren(...filtered.slice(0, limit).map(record => {
      const row = el('div', 'record'), copy = el('div', 'record-copy'); copy.append(el('div', 'record-note', record.note || '把这杯留给未来'), el('div', 'record-date', record.date.replaceAll('-', ' / ')));
      const button = el('button', 'delete', '×'); button.type = 'button'; button.setAttribute('aria-label', `删除 ${record.date} 的 ${money(record.cents)} 元记录`);
      button.addEventListener('click', () => { pendingDelete = record.id; $('delete-detail').textContent = `${record.date} · ¥${money(record.cents)}${record.note ? ` · ${record.note}` : ''}`; $('delete-dialog').showModal(); });
      row.append(el('span', 'record-mark', '↗'), copy, el('span', 'record-value', `+ ¥${money(record.cents)}`), button); return row;
    }));
    $('more').hidden = filtered.length <= limit;
    const yearRows = [...new Set([new Date().getFullYear(), ...Object.keys(stats.years).map(Number)])].sort((a, b) => b - a);
    $('year-list').replaceChildren(...yearRows.map(y => { const data = stats.years[y] || { cents: 0, count: 0 }; const row = el('div', 'year-item'), value = el('div', 'year-amount', `¥${money(data.cents)}`); value.append(el('small', '', `${data.count} 次坚持`)); row.append(el('span', '', `${y} 年`), value); return row; }));
  }
  $('date').value = D.today(); $('date').min = '1900-01-01'; $('date').max = D.today();
  $('amount').addEventListener('input', () => document.querySelectorAll('[data-amount]').forEach(button => { const active = Number(button.dataset.amount) === Number($('amount').value); button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active); }));
  document.querySelectorAll('[data-amount]').forEach(button => { button.setAttribute('aria-pressed', button.classList.contains('selected')); button.addEventListener('click', () => { $('amount').value = button.dataset.amount; $('amount').dispatchEvent(new Event('input')); }); });
  $('entry-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const record = D.validate({ id: crypto.randomUUID(), cents: D.cents($('amount').value), date: $('date').value, note: $('note').value.trim() });
      const previousYear = year; year = Number(record.date.slice(0, 4)); limit = 20;
      if (commit(latest => D.merge(latest, [record]))) { $('note').value = ''; toast(`记下了 ¥${money(record.cents)}。又给未来多留了一点！`); } else year = previousYear;
    } catch (error) { toast(error.message); }
  });
  $('year').addEventListener('change', () => { year = Number($('year').value); limit = 20; render(); });
  $('more').addEventListener('click', () => { limit += 20; render(); });
  $('delete-confirm').addEventListener('click', () => { if (pendingDelete && commit(latest => latest.filter(record => record.id !== pendingDelete))) { $('delete-dialog').close(); pendingDelete = null; toast('这笔记录已删除。'); } });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
  $('backup-open').addEventListener('click', () => { $('backup-message').textContent = ''; $('backup-dialog').showModal(); });
  $('export').addEventListener('click', () => {
    try {
      const raw = localStorage.getItem(D.KEY) || D.pack([]);
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
      const link = el('a'); link.href = url; link.download = `少喝一杯-备份-${D.today()}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      $('backup-message').textContent = '备份已生成，请妥善保存下载的 JSON 文件。';
    } catch { $('backup-message').textContent = '无法导出记录，请保留当前浏览器数据。'; }
  });
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('备份文件超过 10 MB，请检查是否选对文件。');
      const incoming = D.parse(await file.text()); let added = 0;
      if (commit(latest => { const next = D.merge(latest, incoming); added = next.length - latest.length; return next; })) { $('backup-message').textContent = `导入完成，新增 ${added} 笔记录。`; toast(`已导入 ${added} 笔记录。`); }
      else $('backup-message').textContent = '未能导入，现有记录已保留。';
    } catch (error) { $('backup-message').textContent = `导入失败：${error.message} 现有记录已保留。`; }
    finally { event.target.value = ''; }
  });
  window.addEventListener('storage', event => { if (event.key === D.KEY || event.key === null) refresh(); });
  window.addEventListener('focus', () => { $('date').max = D.today(); refresh(); });
  refresh();
})();
