class TwoDArray {
  constructor(array = [], maxLength = 30000) {
    this.maxLength = maxLength;
    this.data = [];
    if (array.length < maxLength) {
      this.data.push([...array]);
    } else {
      for (let i = 0; i < array.length; i += 1) {
        this.push(array[i]);
      }
    }
  }

  concat(arr) {
    /** concat */
  }

  getCurrentArray() {
    const currentOuterIndex = this.data.length;
    if (currentOuterIndex === 0) return null;
    const currentArray = this.data[currentOuterIndex - 1];
    /** Make sure current outer Array is not empty, if not null */
    if (currentArray.length === 0) {
      this.data.pop();
      return this.getCurrentArray();
    }
    return this.data[currentOuterIndex - 1];
  }

  getFirstArray() {
    const currentOuterIndex = this.data.length;
    if (currentOuterIndex === 0) return null;
    const firstArray = this.data[0];
    if (firstArray.length === 0) {
      this.data.shift();
      return this.getFirstArray();
    }
    return this.data[0];
  }

  push(data) {
    let currentArray = this.getCurrentArray();
    /** If current Array is null, new array */
    if (!currentArray) {
      currentArray = [];
      this.data.push(currentArray);
    }
    if (currentArray.length < this.maxLength) {
      currentArray.push(data);
    } else {
      const newOuterArray = [];
      newOuterArray.push(data);
      this.data.push(newOuterArray);
    }
  }

  pop() {
    const currentArray = this.getCurrentArray();
    if (currentArray === null) return null;
    return currentArray.pop();
  }

  // todo: to be done;
  unshift(data) {
    const firstArray = this.getFirstArray();
    if (firstArray === null || firstArray.length >= this.maxLength) {
      const newFirstArray = [data];
      this.data.unshift(newFirstArray);
    } else {
      firstArray.unshift(data);
    }
  }

  shift() {
    const firstArray = this.getFirstArray();
    if (firstArray === null) return null;
    return firstArray.shift();
  }

  peep(index = -1) {
    if (index === -1) {
      const currentArray = this.getCurrentArray();
      if (currentArray === null) return null;
      return currentArray[currentArray.length - 1];
    }
    let count = 0;
    for (let i = 0; i < this.data.length; i += 1) {
      if (count + this.data[i].length > index) {
        return this.data[i][index - count];
      }
      count += this.data[i].length;
    }
    return undefined;
  }

  get length() {
    return this.data.reduce((lastValue, item) => {
      return lastValue + item.length;
    }, 0);
  }
}


export default TwoDArray;
