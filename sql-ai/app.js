const API_KEY_STORAGE = "deepseek-api-key";
const MODEL_STORAGE = "deepseek-model-name";
const DEFAULT_MODEL = "deepseek-v4-flash";
const apiKey = document.querySelector("#api-key");
const modelName = document.querySelector("#model-name");
const input = document.querySelector("#input");
const output = document.querySelector("#output");
const saveKey = document.querySelector("#save-key");
const clearKey = document.querySelector("#clear-key");
const formatButton = document.querySelector("#format");
const copyButton = document.querySelector("#copy");
const status = document.querySelector("#status");

apiKey.value = localStorage.getItem(API_KEY_STORAGE) || "";
modelName.value = localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function cleanModelOutput(text) {
  return text.trim().replace(/^```(?:sql)?\s*/i, "").replace(/\s*```$/, "").trim();
}

saveKey.addEventListener("click", () => {
  const value = apiKey.value.trim();
  const model = modelName.value.trim() || DEFAULT_MODEL;
  modelName.value = model;
  localStorage.setItem(MODEL_STORAGE, model);
  if (!value) {
    localStorage.removeItem(API_KEY_STORAGE);
    setStatus(`模型 ${model} 已保存；API Key 未保存。`);
    return;
  }
  localStorage.setItem(API_KEY_STORAGE, value);
  setStatus(`API Key 与模型 ${model} 已保存到当前浏览器。`);
});

clearKey.addEventListener("click", () => {
  localStorage.removeItem(API_KEY_STORAGE);
  apiKey.value = "";
  setStatus("API Key 已从当前浏览器删除。");
});

formatButton.addEventListener("click", async () => {
  const key = apiKey.value.trim() || localStorage.getItem(API_KEY_STORAGE) || "";
  const model = modelName.value.trim() || localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
  if (!key) {
    setStatus("请先输入 DeepSeek API Key。", true);
    apiKey.focus();
    return;
  }
  if (!input.value.trim()) {
    setStatus("请输入 SQL。", true);
    return;
  }
  formatButton.disabled = true;
  setStatus(`正在请求 ${model}；当前 SQL 会离开浏览器发送给 DeepSeek…`);
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content: "You are a SQL formatter. Return only formatted SQL, without Markdown fences or explanations. Preserve semantics, comments, strings, identifiers, and dialect-specific syntax. Uppercase SQL keywords and functions. Put SELECT, FROM, WHERE, GROUP BY, ORDER BY, HAVING, JOIN, and ON on separate lines. Use 4-space indentation. Use leading commas in SELECT lists when it improves readability. Never invent or delete SQL logic."
          },
          { role: "user", content: input.value }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("DeepSeek 返回为空");
    output.value = cleanModelOutput(text);
    setStatus("AI 格式化完成。结果已留在当前浏览器。");
  } catch (error) {
    setStatus(`AI 格式化失败：${error.message}`, true);
  } finally {
    formatButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  setStatus("已复制格式化结果。");
});
