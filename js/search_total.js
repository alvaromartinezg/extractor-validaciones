// search_total.js
// Lógica basada en BusquedaTotal.html (Buscador tipo Notepad++) modularizada.

export function runTotalSearch(filesStore, palabrasRaw) {
  const palabras = (palabrasRaw || "")
    .split(",")
    .map(p => p.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);

  const resultados = [];

  if (palabras.length === 0) return { palabras, resultados };

  filesStore.forEach((archivo, idxArchivo) => {
    const lineas = archivo.lines;

    for (let i = 0; i < lineas.length; i++) {
      const ventana = lineas.slice(i, i + 10).join("\n").toLowerCase();

      if (palabras.every(p => ventana.includes(p))) {
        resultados.push({
          archivo: archivo.name,
          idxArchivo,
          linea: i,
          fragmento: lineas.slice(Math.max(0, i - 10), Math.min(lineas.length, i + 10))
        });
      }
    }
  });

  return { palabras, resultados };
}

export function renderResultsList(resultados, contenedor, onClick) {
  contenedor.innerHTML = "";

  if (!resultados.length) {
    contenedor.innerHTML = "<div class='result-item'>❌ No se encontraron coincidencias</div>";
    return;
  }

  resultados.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = `<b>${_escapeHtml(r.archivo)}</b><br><span class="muted small">Línea aprox: ${r.linea + 1}</span>`;
    div.onclick = () => onClick(i);
    contenedor.appendChild(div);
  });
}

export function renderPreview(resultados, idx, palabrasRaw, titleEl, preEl) {
  const r = resultados[idx];
  if (!r) return;

  titleEl.textContent = `${r.archivo} — línea ${r.linea + 1}`;

  let texto = r.fragmento.join("\n");

  const palabras = (palabrasRaw || "")
    .split(",")
    .map(p => p.trim())
    .filter(Boolean);

  // Highlight seguro (escapa, luego reemplaza por spans)
  let safe = _escapeHtml(texto);

  palabras.forEach(p => {
    const escaped = _escapeRegExp(p);
    const re = new RegExp(escaped, "gi");
    safe = safe.replace(re, m => `<span class="highlight">${m}</span>`);
  });

  preEl.innerHTML = safe;
  preEl.scrollTop = 0;
}

function _escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function _escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
