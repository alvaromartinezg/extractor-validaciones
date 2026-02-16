// blocks.js
// Lógica basada en BloquesNotas.html (Extractor + Buscador de Bloques) con leves ajustes para modularizar.

export function parseBlocksFromFiles(filesStore) {
  const bloques = [];

  for (const f of filesStore) {
    const lineas = f.lines;

    let bloqueActual = [];
    let dentroBloque = false;
    let contadorSinN = 0;

    for (const lineaRaw of lineas) {
      const texto = (lineaRaw ?? "").replace(/\r$/, "");

      if (/^\s*1\)\s*NEW SITE\s*:/i.test(texto)) {
        if (bloqueActual.length) {
          _cerrarBloque(bloqueActual, bloques);
        }
        bloqueActual = [`[Archivo: ${f.name}]\n${texto}`];
        dentroBloque = true;
        contadorSinN = 0;
        continue;
      }

      if (!dentroBloque) continue;

      if (/^\s*\d+\)\s*.+/.test(texto)) {
        bloqueActual.push(texto);
        contadorSinN = 0;
      } else {
        bloqueActual.push(texto);
        contadorSinN++;
      }

      // Si detecta línea de chat tipo WhatsApp, forzar cierre pronto (misma idea del original).
      if (_esChat(texto)) contadorSinN = 999;

      if (contadorSinN >= 10) {
        _cerrarBloque(bloqueActual, bloques);
        bloqueActual = [];
        dentroBloque = false;
        contadorSinN = 0;
      }
    }

    if (bloqueActual.length) _cerrarBloque(bloqueActual, bloques);
  }

  return bloques;
}

export function filterBlocks(bloquesGlobales, { filtroSite, filtroEnlace, busqueda }) {
  const fs = (filtroSite || "").toLowerCase();
  const fe = (filtroEnlace || "").toLowerCase();
  const bg = (busqueda || "").toLowerCase();

  const out = [];
  for (let i = 0; i < bloquesGlobales.length; i++) {
    const bloque = bloquesGlobales[i];
    const texto = bloque.toLowerCase();

    let mostrar = true;
    if (fs && !texto.includes(fs)) mostrar = false;
    if (fe && !texto.includes(fe)) mostrar = false;
    if (bg && !texto.includes(bg)) mostrar = false;

    if (mostrar) out.push({ index: i, bloque });
  }
  return out;
}

function _esChat(texto) {
  return /^\[\d{1,2}\/\d{1,2}\/\d{2,4}/.test(texto);
}

function _cerrarBloque(bloqueActual, bloques) {
  let ultimoN = -1;

  bloqueActual.forEach((l, i) => {
    if (/^\s*\d+\)\s*.+/.test(l)) ultimoN = i;
  });

  if (ultimoN >= 0) {
    const bloqueLimpio = bloqueActual.slice(0, ultimoN + 1);
    bloques.push(bloqueLimpio.join("\n"));
  }
}
