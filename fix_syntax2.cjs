const fs = require('fs');
let code = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

const classRegex = /class MinHeap<T> \{[\s\S]*\}\}/;
const heapCode = `class MinHeap<T> {
  heap: T[] = [];
  constructor(public compare: (a: T, b: T) => number) {}
  get length() { return this.heap.length; }
  push(val: T) {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }
  shift(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }
  bubbleUp(idx: number) {
    const val = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this.compare(val, parent) >= 0) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = val;
  }
  sinkDown(idx: number) {
    const length = this.heap.length;
    const val = this.heap[idx];
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let swapIdx = -1;
      let leftVal: T | undefined;
      if (leftIdx < length) {
        leftVal = this.heap[leftIdx]!;
        if (this.compare(leftVal, val) < 0) swapIdx = leftIdx;
      }
      if (rightIdx < length) {
        const rightVal = this.heap[rightIdx]!;
        if ((swapIdx === -1 && this.compare(rightVal, val) < 0) || 
            (swapIdx !== -1 && leftVal && this.compare(rightVal, leftVal) < 0)) {
          swapIdx = rightIdx;
        }
      }
      if (swapIdx === -1) break;
      this.heap[idx] = this.heap[swapIdx];
      idx = swapIdx;
    }
    this.heap[idx] = val;
  }
}`;

code = code.replace(classRegex, heapCode);

fs.writeFileSync('src/utils/tripPlanner.ts', code);
