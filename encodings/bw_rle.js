//TODO use proper brightness function
const TRESHOLD = 128;
const threshold = (r, g, b) => {
  return ((r + g + b) / 3) > TRESHOLD;
};

export default (pixels) => {
  const data = pixels.data;
  
  const out = [];
  
  //Encode metadata
  out.push(pixels.shape[1]); //Width
  out.push(pixels.shape[2]); //Height
  
  //Encode pixels
  let counter = 0;
  let pv = false;
  let i = 0;
  while (i < data.length) {
    const r = data[i++];
    const g = data[i++];
    const b = data[i++];
    i++;
    const v = threshold(r, g, b);
    if (v === pv) {
      counter++;
    } else {
      while (counter > 0xFF) {
        counter -= 0xFF;
        out.push(0xFF);
      }
      out.push(counter);
      pv = v;
    }
  }
  
  return out;
}
