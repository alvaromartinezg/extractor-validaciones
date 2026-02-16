// main.js
import { parseBlocksFromFiles, filterBlocks } from "./blocks.js";
import { runTotalSearch, renderResultsList, renderPreview } from "./search_total.js";

const ui = {
  fileInput: document.getElementById("fileInput"),
  btnLoad: document.getElementById("btnLoad"),
  statusText: document.getElementById("statusText"),
  progressBar: document.getElementById("progressBar"),
  loadingOverlay: document.getElementById("loadingOverlay"),

  // tabs
  tabButtons: Array.from(document.querySelectorAll(".tabbtn")),
  tabBlocks: document.getElementById("tabBlocks"),
  tabSearch: document.getElementById("tabSearch"),

  // blocks
  btnProcessBlocks: document.getElementById("btnProcessBlocks"),
  btnFilterBlocks: document.getElementById("btnFilterBlocks"),
  filtroSite: document.getElementById("filtroSite"),
  filtroEnlace: document.getElementById("filtroEnlace"),
  busquedaGeneral: document.getElementById("busquedaGeneral"),
  blocksResult: document.getElementById("blocksResult"),
  blocksCount: document.getElementById("blocksCount"),

  // total search
  palabras: document.getElementById("palabras"),
  btnSearch: document.getElementById("btnSearch"),
  resultados: document.getElementById("resultados"),
  tituloPreview: document.getElementById("tituloPreview"),
  textoPreview: document.getElementById("textoPreview")
};

let filesStore = [];      // [{name, text, lines}]
let bloquesGlobales = []; // [string]
let resultadosGlobales = [];

function setLoading(isLoading) {
  ui.loadingOverlay.style.display = isLoading ? "flex" : "none";
}

function setProgress(pct) {
  ui.progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function setStatus(text, ok = true) {
  ui.statusText.textContent = text;
  ui.statusText.className = ok ? "ok" : "bad";
}

function switchTab(tabId) {
  ui.tabButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
  ui.tabBlocks.classList.toggle("hidden", tabId !== "tabBlocks");
  ui.tabSearch.classList.toggle("hidden", tabId !== "tabSearch");
}

ui.tabButtons.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

ui.btnLoad.addEventListener("click", async () => {
  const files = ui.fileInput.files;
  if (!files || !files.length) {
    alert("Selecciona uno o más archivos TXT");
    return;
  }

  setLoading(true);
  setProgress(0);
  setStatus("Cargando…", true);

  try {
    filesStore = await readFiles(Array.from(files), pct => setProgress(pct));
    setStatus(`Cargados: ${filesStore.length} archivo(s)`, true);

    // Reset módulos
    bloquesGlobales = [];
    resultadosGlobales = [];
    ui.blocksResult.innerHTML = "";
    ui.blocksCount.textContent = "Bloques: 0";
    ui.resultados.innerHTML = "";
    ui.tituloPreview.textContent = "—";
    ui.textoPreview.textContent = "";

  } catch (err) {
    console.error(err);
    setStatus("Error cargando archivos", false);
    alert("Ocurrió un error al leer los archivos. Revisa consola.");
  } finally {
    setLoading(false);
    setProgress(100);
    setTimeout(() => setProgress(0), 600);
  }
});

ui.btnProcessBlocks.addEventListener("click", () => {
  if (!filesStore.length) {
    alert("Primero carga tus TXT (botón Cargar).");
    return;
  }
  setLoading(true);
  try {
    bloquesGlobales = parseBlocksFromFiles(filesStore);
    ui.blocksCount.textContent = `Bloques: ${bloquesGlobales.length}`;
    // Render inicial: todos
    renderBlocks(filterBlocks(bloquesGlobales, { filtroSite: "", filtroEnlace: "", busqueda: "" }));
  } finally {
    setLoading(false);
  }
});

ui.btnFilterBlocks.addEventListener("click", () => {
  if (!bloquesGlobales.length) {
    alert("Primero procesa BLOQUES.");
    return;
  }

  const matches = filterBlocks(bloquesGlobales, {
    filtroSite: ui.filtroSite.value,
    filtroEnlace: ui.filtroEnlace.value,
    busqueda: ui.busquedaGeneral.value
  });
  renderBlocks(matches);
});

function renderBlocks(matches) {
  ui.blocksResult.innerHTML = "";

  if (!matches.length) {
    ui.blocksResult.innerHTML = "<div class='pill bad'>No se encontraron resultados</div>";
    return;
  }

  const frag = document.createDocumentFragment();
  matches.forEach((m, idx) => {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "12px";
    wrap.innerHTML = `<pre>===== BLOQUE ${m.index + 1} =====\n${escapeHtml(m.bloque)}</pre>`;
    frag.appendChild(wrap);
  });

  // Convertir pre a texto literal (ya escapado)
  ui.blocksResult.appendChild(frag);
}

ui.btnSearch.addEventListener("click", () => {
  if (!filesStore.length) {
    alert("Primero carga tus TXT (botón Cargar).");
    return;
  }

  const raw = ui.palabras.value || "";
  const { resultados } = runTotalSearch(filesStore, raw);

  resultadosGlobales = resultados;
  renderResultsList(resultadosGlobales, ui.resultados, (i) => {
    renderPreview(resultadosGlobales, i, raw, ui.tituloPreview, ui.textoPreview);
  });

  // Auto-preview primer resultado
  if (resultadosGlobales.length) {
    renderPreview(resultadosGlobales, 0, raw, ui.tituloPreview, ui.textoPreview);
  }
});

async function readFiles(files, onProgress) {
  const out = [];
  let done = 0;

  for (const f of files) {
    const text = await f.text(); // moderno + simple
    out.push({
      name: f.name,
      text,
      lines: text.split(/\r?\n/)
    });
    done++;
    if (onProgress) onProgress(Math.round((done / files.length) * 100));
  }
  return out;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Estado inicial
setStatus("Sin archivos", true);
switchTab("tabBlocks");
