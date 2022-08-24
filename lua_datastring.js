export default function(buf) {
  let str = '"';
  let dangerEscape = false;
  for (const byte of buf) {
    const escapeMap = [];
    {
      escapeMap[7] = 'a';
      escapeMap[8] = 'b';
      escapeMap[9] = 't';
      escapeMap[10] = 'n';
      escapeMap[11] = 'v';
      escapeMap[12] = 'f';
      escapeMap[13] = 'r';
      escapeMap[34] = '"';
      escapeMap[92] = '\\';
    }
    if (escapeMap[byte]) {
      str += '\\' + escapeMap[byte];
      dangerEscape = false;
    } else if ((byte >= 32) && (byte <= 126)) {
      if (dangerEscape && (byte >= 48) && (byte <= 57)) {
        //TODO modify dangerous escape seq
        //     like this: \9 => \009
        //     instead of doing this
        //     saves 1 character per number
        //     if escape sequence is 2 chars
        //     before: \69\48 <...escape unsafe>
        //     after:  \0690  <...escape safe>  
        str += '\\' + byte.toString();
        dangerEscape = true;
      } else {
        str += String.fromCharCode(byte);
        dangerEscape = false;
      }
    } else {
      const byteStr = byte.toString();
      str += '\\' + byteStr;
      dangerEscape = byteStr.length !== 3;
    }
  }
  return str + '"';
};
