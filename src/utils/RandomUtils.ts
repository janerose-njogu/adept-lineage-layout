export class RandomUtils {
  isNextGaussian: boolean = false;
  nextGaussian: number = 0;
  seed1: number = 0;
  seed2: number = 0;
  seed3: number = 0;
  seed: number = 0;
  
  constructor(seed?: number) {
    this.seed1 = 0;
    this.seed2 = 0;
    this.seed3 = 0;

    if (typeof seed === "number") {
      this.seed = seed;
    } else {
      this.seed = 4023985827; // + this.hashCode();
      // this.$p = GeneralUtils.callFunction() + getHashCode()
    }
  }

  getRandomIntWithBits(bits: number): number {
    if (bits >= 31) {
      return this.getRandomInt31();
    } else if (bits > 0) {
      return (this.getRandomFloat() * bits) | 0;
    } else {
      throw new Error("Invalid bits value: bits must be greater than 0.");
    }
  }
  getRandomInt(): number {
    // $m!/$m1!
    return this.getRandomInt31();
  }

  getRandomBoolean(): boolean {
    // $m4!
    return this.getRandomFloat() > 0.5;
  }
  getRandomFloat(): number {
    // $m3!
    this.seed1 = (171 * this.seed1) % 30269;
    this.seed2 = (172 * this.seed2) % 30307;
    this.seed3 = (170 * this.seed3) % 30323;
    return (this.seed1 / 30269 + this.seed2 / 30307 + this.seed3 / 30323) % 1;
  }
  getRandomDouble(): number {
    // $m2!
    return this.getRandomIntWithBits(24) / 16777216;
  }
  getNextGaussian(): number {
    // $m5!
    if (this.isNextGaussian) {
      this.isNextGaussian = false;
      return this.nextGaussian;
    }
    let u, v, s;
    do {
      u = 2 * this.getRandomFloat() - 1;
      v = 2 * this.getRandomFloat() - 1;
      s = u * u + v * v;
    } while (s >= 1);
    const multiplier = Math.sqrt((-2 * Math.log(s)) / s);
    this.nextGaussian = v * multiplier;
    this.isNextGaussian = true;
    return u * multiplier;
  }

  getRandomInt31(): number {
    // $m14!
    return (2147483647 * this.getRandomFloat()) | 0;
  }
  generateRandomNumber(maxValue: number) {
    //"$m6!"
    if (maxValue <= 0) throw new Error("maxValue must be positive");
    let randomValue, result;
    do {
      randomValue = (result = this.getRandomIntWithBits(31)) % maxValue;
    } while (result - randomValue + (maxValue - 1) < 0);
    return randomValue;
  }

  generateRandomSubset(count: number, start: number, end: number) {
    //"$m12!"
    let rangeArray,
      resultArray = null;
    const rangeSize = --end - start + 1;
    if (rangeSize >= count && count > 0) {
      rangeArray = new Array(rangeSize);
      resultArray = new Array(count);
      for (let i = 0, current = start; i < rangeSize; i++, current++)
        rangeArray[i] = current;
      let currentIndex = 0;
      for (
        let remaining = rangeSize - 1;
        currentIndex < count;
        currentIndex++, remaining--
      ) {
        const randomIndex = this.generateRandomNumber(remaining + 1);
        resultArray[currentIndex] = rangeArray[randomIndex];
        if (randomIndex < remaining)
          rangeArray[randomIndex] = rangeArray[remaining];
      }
    }
    return resultArray;
  }

  generateBooleanArray(total: number, selected: number) {
    //"$m11!"
    if (selected > total) throw new Error("Invalid arguments for getBoolArray");
    const selectedIndices = this.generateRandomSubset(selected, 0, total);
    const booleanArray = new Array(total);
    if (selectedIndices !== null) {
      for (let i = 0; i < selectedIndices.length; i++)
        booleanArray[selectedIndices[i]] = true;
    }
    return booleanArray;
  }

  generateFrequencyArray(size: number, iterations: number) {
    //"$m10!"
    const frequencyArray = new Array(size);
    for (let i = 0; i < iterations; i++)
      frequencyArray[this.generateRandomNumber(frequencyArray.length)]++;
    return frequencyArray;
  }

  generateRandomFloat(minValue: number, maxValue: number) {
    //"$m9!"
    return this.getRandomFloat() * (maxValue - minValue) + minValue;
  }

  generateRandomInteger(minValue: number, maxValue: number) {
    //"$m8!"
    return this.generateRandomNumber(maxValue - minValue) + minValue;
  }

  shuffleArray(array: any[]) {
    //"$m7!"
    for (let i = 0; i < array.length; i++) {
      const randomIndex = this.generateRandomNumber(array.length);
      const temp = array[i];
      array[i] = array[randomIndex];
      array[randomIndex] = temp;
    }
    for (let i = array.length - 1; i >= 0; i--) {
      const randomIndex = this.generateRandomNumber(array.length);
      const temp = array[i];
      array[i] = array[randomIndex];
      array[randomIndex] = temp;
    }
  }
}
