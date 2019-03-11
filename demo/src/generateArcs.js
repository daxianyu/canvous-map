function generate(width, height) {
  const x2 = Math.random() * width;
  const y2 = Math.random() * height;
  return [[width - 10, 10], [x2, y2]];
}

export default generate;
