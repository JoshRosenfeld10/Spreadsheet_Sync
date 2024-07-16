const shiftN = (arr, n) => {
  let shiftedArr = [];

  for (let i = 0; i < n; i++) {
    shiftedArr.push(arr.shift());
  }

  return shiftedArr;
};

module.exports = shiftN;
