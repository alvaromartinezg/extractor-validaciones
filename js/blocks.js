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

export function filterBlocks(bloquesGlobales, { f1, f2, f3 }) {
  const F1 = (f1 || "").toLowerCase().trim();
  const F2 = (f2 || "").toLowerCase().trim();
  const F3 = (f3 || "").toLowerCase().trim();

  const out = [];
  for (let i = 0; i < bloquesGlobales.length; i++) {
    const bloque = bloquesGlobales[i];
    const texto = bloque.toLowerCase();

    let ok = true;
    if (F1 && !texto.includes(F1)) ok = false;
    if (F2 && !texto.includes(F2)) ok = false;
    if (F3 && !texto.includes(F3)) ok = false;

    if (ok) out.push({ index: i, bloque });
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
