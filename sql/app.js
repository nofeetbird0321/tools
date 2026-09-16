const PYODIDE_VERSION = "314.0.7";
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const input = document.querySelector("#input");
const output = document.querySelector("#output");
const formatButton = document.querySelector("#format");
const copyButton = document.querySelector("#copy");
const clearButton = document.querySelector("#clear");
const status = document.querySelector("#status");

let runtimePromise;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      setStatus("正在加载浏览器内 Python 运行时…");
      const pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX });
      const source = await fetch("./local_formatter.py").then((response) => {
        if (!response.ok) throw new Error(`无法读取本地 Python 模块（${response.status}）`);
        return response.text();
      });
      pyodide.runPython(source);
      setStatus("Python 已在浏览器内就绪；SQL 不会上传。");
      return pyodide;
    })().catch((error) => {
      runtimePromise = null;
      setStatus(`Python 运行时加载失败：${error.message}`, true);
      throw error;
    });
  }
  return runtimePromise;
}

async function formatSql() {
  const sql = input.value;
  if (!sql.trim()) {
    output.value = "";
    setStatus("请输入 SQL。");
    return;
  }
  formatButton.disabled = true;
  try {
    const pyodide = await getRuntime();
    pyodide.globals.set("sql_input", sql);
    output.value = pyodide.runPython("format_sql(sql_input)");
    setStatus("格式化完成；处理发生在当前浏览器。");
  } catch (error) {
    setStatus(`格式化失败：${error.message}`, true);
  } finally {
    formatButton.disabled = false;
  }
}

formatButton.addEventListener("click", formatSql);
clearButton.addEventListener("click", () => {
  input.value = "";
  output.value = "";
  setStatus("已清空。");
});
copyButton.addEventListener("click", async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  setStatus("已复制格式化结果。");
});
