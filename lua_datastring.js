const escapeMap = [];
escapeMap[7] = 'a';
escapeMap[8] = 'b';
escapeMap[9] = 't';
escapeMap[10] = 'n';
escapeMap[11] = 'v';
escapeMap[12] = 'f';
escapeMap[13] = 'r';
escapeMap[34] = '"';
escapeMap[92] = '\\';

export default function datastring(buf) {
  let str = '"';
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    if (escapeMap[byte]) {
      str += '\\' + escapeMap[byte];
    } else if ((byte >= 32) && (byte <= 126)) {
      str += String.fromCharCode(byte);
    } else {
      const byteStr = byte.toString();
      str += '\\';
      // If the next character is number, pad with 0
      // To prevent it from being trated as a part
      // of the escape sequence
      if (
        (buf[i+1] != null) &&
        (buf[i+1] >= 48) &&
        (buf[i+1] <= 57) &&
        (byteStr.length !== 3)
      ) {
        str += byteStr.padStart(3, '0');
      } else {
        str += byteStr;
      }
    }
  }
  return str + '"';
};
