/**
 * @return {Array}
 */
function generateMarkData(options = {}) {
  const {
    width = 300, height = 300,
    colCount = 200,
    rowCount = 200,
  } = options;
  const data = [];
  const gridWidth = width / colCount;
  const gridHeight = height / colCount;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const red = Math.ceil(255 - rowIndex * 255 / rowCount).toString(16).padStart(2, '0');
      const green = Math.ceil(255 - colIndex * 255 / colCount).toString(16).padStart(2, '0');
      const point = {
        x: gridWidth * colIndex + gridWidth / 2,
        y: gridHeight * rowIndex + gridHeight / 2,
        fillColor: `#${red + green}00`,
      };
      data.push(point);
    }
  }
  return data;
}

export default generateMarkData;
