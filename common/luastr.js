// NOT USED RN, SEE luastr-workaround

// ASII CODE, ESCAPE, LUA STR REPR (optional)
const ESCAPE = [
  [10, 'n'], //must be first
  [13, 'r'],
  [0,  '0'],
];
const LUA_PRE_STR = Buffer.from('([=[\n');
const LUA_POST_STR = Buffer.from(']=])' + ESCAPE.slice().reverse().map(esc => (
  `:gsub('\\n${esc[1]}','${esc[2] ?? ('\\' + esc[1])}')`
)).join(''));

export default function(buf) {
  let processedBuf = buf;
  for (const esc of ESCAPE) {
    processedBuf = processedBuf.replace(Buffer.from([esc[0]]), Buffer.from([10, ...esc[1].split('').map(chr => chr.charCodeAt())]));
  }
  return Buffer.concat([
    LUA_PRE_STR,
    processedBuf,
    LUA_POST_STR,
  ]);
}
