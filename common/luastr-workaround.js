export default function(buf) {
  let content = '';
  for (const byte of buf) {
    content += byte.toString(16).padStart(2, 0);
  }
  return Buffer.from(`(function()local s="${content}";local o={}for i=1,#s,2 do o[#o+1]=string.char(tonumber(s:sub(i,i+1),16))end return table.concat(o)end)()`);
}
