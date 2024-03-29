//TODO use proper brightness function
const TRESHOLD = 128;
const threshold = (r, g, b) => {
  return ((r + g + b) / 3) > TRESHOLD;
};

export default (data, width, height, support_hq) => {
  const out = [];
  
  //Encode metadata
  if (support_hq) {
    out.push('H'.charCodeAt());
    out.push('Q'.charCodeAt());
    out.push(width & 0xFF);
    out.push((width & 0xFF00) >> 8);
    out.push(height & 0xFF);
    out.push((height & 0xFF00) >> 8);
  } else {
    out.push(width);
    out.push(height);
  }
  
  //Encode pixels
  let counter = 0;
  let pv = false;
  let i = 0;
  while (i < data.length) {
    const r = data[i++];
    const g = data[i++];
    const b = data[i+=2];
    const v = threshold(r, g, b);
    if (v === pv) {
      counter++;
    } else {
      while (counter >= 0xFF) {
        counter -= 0xFF;
        out.push(0xFF);
      }
      out.push(counter);
      pv = v;
      counter = 1;
    }
  }
  
  return out;
}
