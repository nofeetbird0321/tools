(function (root) {
  'use strict';
  const KEY = 'less-tea.records.v1';
  function today(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  function cents(value) {
    const text = String(value).trim();
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(text)) throw new Error('请输入大于 0、最多两位小数的金额（最高 99,999.99 元）。');
    const [whole, fraction = ''] = text.split('.');
    const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (result <= 0 || result > 9999999) throw new Error('金额需大于 0，最高 99,999.99 元。');
    return result;
  }
  function validDate(value, latest = today()) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > latest) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function validate(record) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(record.id) || !validDate(record.date) || !Number.isSafeInteger(record.cents) || record.cents < 1 || record.cents > 9999999 || typeof record.note !== 'string' || record.note.length > 80) throw new Error('记录格式有误，请使用本页导出的备份，日期不能晚于今天。');
    return { id: record.id, date: record.date, cents: record.cents, note: record.note };
  }
  function parse(text) {
    const data = JSON.parse(text);
    if (!data || data.version !== 1 || !Array.isArray(data.records) || data.records.length > 50000) throw new Error('不支持此备份格式（最多 50,000 笔记录）。');
    const records = data.records.map(validate);
    if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('备份中存在重复编号。');
    return records;
  }
  function pack(records) { return JSON.stringify({ version: 1, records }, null, 2); }
  function merge(existing, incoming) {
    const merged = new Map(existing.map(record => [record.id, record]));
    for (const record of incoming) {
      const previous = merged.get(record.id);
      if (previous && (previous.date !== record.date || previous.cents !== record.cents || previous.note !== record.note)) throw new Error('备份与现有记录的编号冲突，未进行导入。');
      merged.set(record.id, record);
    }
    if (merged.size > 50000) throw new Error('最多支持 50,000 笔记录，请先导出备份。');
    return [...merged.values()];
  }
  function summarize(records, year, now = new Date()) {
    const months = Array(12).fill(0);
    const years = {};
    let total = 0, count = 0, all = 0;
    for (const record of records) {
      const y = Number(record.date.slice(0, 4));
      const m = Number(record.date.slice(5, 7)) - 1;
      all += record.cents;
      if (!years[y]) years[y] = { cents: 0, count: 0 };
      years[y].cents += record.cents; years[y].count++;
      if (y === year) { total += record.cents; count++; months[m] += record.cents; }
    }
    return { total, count, all, months, years, currentMonth: year === now.getFullYear() ? months[now.getMonth()] : null };
  }
  const api = { KEY, today, cents, validDate, validate, parse, pack, merge, summarize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TeaData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
