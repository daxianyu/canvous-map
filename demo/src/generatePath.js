function pathGenerator(count, size) {
  const result = [];
  for (let i = 0; i < size; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    result.push([x, y]);
  }
  return result;
}

export default pathGenerator;
