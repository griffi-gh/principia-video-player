Buffer.prototype.replace = function replace(sub, newSub, encoding) {
  // input must be buffer; else force convert it to one
  !(newSub instanceof Buffer) ? newSub = new Buffer(newSub) : 0
  let indexes = [], i = -1; // target and index for occurences
  let cursorOld = 0, cursorNew = 0, diff = 0 // cursors for replacing
  // get all occurences of sub
  while ((i = this.indexOf(sub, i + 1)) != -1) {
    indexes.push(i);
  }
  // resulting buffer; shortly unallocated; destroy in error case
  let res = Buffer.allocUnsafe(this.length -
                               indexes.length * sub.length +
                               indexes.length * newSub.length)

  indexes.forEach((el, index, array) => {
    // copy everthing until first occurence into new buffer. As consquence
    // advance cursors (of the buffer reads) either according to the distances
    // plus size of the insert
    this.copy(res, cursorNew, cursorOld, el)
    // calculate diff for the next jump mark of th cursor.
    // First change requires a diff that is for both the same. This is different
    // for first call where diffing begins at 0. Else note: diff between to
    // occurences must be bumped up by 1
    diff = el - (index > 0 ? array[index - 1] + 1 : 0)
    cursorNew += diff
    cursorOld += diff
    // copy over the replacement for sub part of bufffer
    newSub.copy(res, cursorNew, 0, newSub.length)
    // advance cursor by replacement length
    cursorNew += newSub.length
    // advance cursor by one except for the last time. At last call we just want
    // to copy until the end of the resulting buffer
    index !== array.length ? cursorOld += sub.length : 0
  })
  // this doesn't need iteration since we just want to fill the rest of the
  // buffer starting from the last occurence until computed end.
  this.copy(res, cursorNew, cursorOld, res.length - 1)

  return res
}