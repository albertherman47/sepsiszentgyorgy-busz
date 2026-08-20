const fs = require('fs');
let code = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

// Fix TS2345: leftVal and rightVal in MinHeap
code = code.replace(
  'let leftVal;',
  'let leftVal: T | undefined;'
);

code = code.replace(
  'leftVal = this.heap[leftIdx];',
  'leftVal = this.heap[leftIdx]!;'
);

code = code.replace(
  'if ((swapIdx === -1 && this.compare(rightVal, val) < 0) ||',
  'if ((swapIdx === -1 && this.compare(rightVal, val) < 0) || (swapIdx !== -1 && leftVal && this.compare(rightVal, leftVal) < 0)) {'
);

code = code.replace(
  'const rightVal = this.heap[rightIdx];',
  'const rightVal = this.heap[rightIdx]!;'
);

// Fix TS1294: what is erasableSyntaxOnly? 
// Oh, enums or private class fields!
code = code.replace(
  /private heap: T\[\]/g,
  'heap: T[]'
);
code = code.replace(
  /private bubbleUp/g,
  'bubbleUp'
);
code = code.replace(
  /private sinkDown/g,
  'sinkDown'
);
code = code.replace(
  /private compare/g,
  'public compare'
);


fs.writeFileSync('src/utils/tripPlanner.ts', code);
