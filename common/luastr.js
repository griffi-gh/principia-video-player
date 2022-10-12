// ASII CODE, ESCAPE, LUA STR REPR (optional)
const ESCAPE = [
  //these three are confirmed to break stuff
  [10, 'n'], //must be first
  [13, 'r'],
  [0,  '0'],
  //maybe some are actually not needed:
  //but some of these may break save files
  [1,  '1'],
  [2,  '2'],
  [3,  '3'],
  [4,  '4'],
  [5,  '5'],
  [6,  '6'],
  [7,  '7'],
  [8,  '8'],
];
const LUA_PRE_STR = Buffer.from('([=[\n');
const LUA_POST_STR = Buffer.from(']=])' + ESCAPE.map(esc => (
  `:gsub('\\n${esc[1]}','${esc[2] ?? ('\\' + esc[1])}')`
)).join(''));

export default function(buf) {
  let processedBuf = buf;
  for (const esc of ESCAPE) {
    processedBuf = processedBuf.replace(Buffer.from([esc[0]]), Buffer.from([10, esc[1].charCodeAt()]));
  }
  return Buffer.concat([
    LUA_PRE_STR,
    processedBuf,
    LUA_POST_STR,
  ]);
}
