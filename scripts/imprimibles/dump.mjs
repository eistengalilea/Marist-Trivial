const m = await import(process.argv[2]);
const s = await import(process.argv[3]);
const pt = await import(process.argv[4]);
const gl = await import(process.argv[5]);
const msg = await import(process.argv[6]);
console.log(JSON.stringify({q:m.QUESTION_BANK, pt:pt.QUESTIONS_PT, gl:gl.QUESTIONS_GL, cats:Object.fromEntries(Object.entries(msg.MESSAGES).map(([k,v])=>[k,v.categories])), sym:{vb:s.MARCHA_SYMBOL_VIEWBOX, paths:s.MARCHA_SYMBOL_PATHS}}));
