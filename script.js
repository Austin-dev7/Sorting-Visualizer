let array = [];
let bars = [];

let isSorting = false;
let stopRequested = false;
let animationDelayMs = 30;

const stats = {
  comparisons: 0,
  swaps: 0,
  moves: 0,
  startTime: 0,
  endTime: 0
};

function el(id) {
  return document.getElementById(id);
}

function getSpeedDelayMs() {
  // speed slider: 1..100 -> ~95ms .. ~5ms
  const speed = Number(el('speed').value);
  const t = 95 - (speed - 1) * (90 / 99);
  return Math.max(5, Math.round(t));
}

function delay() {
  return new Promise((resolve) => setTimeout(resolve, animationDelayMs));
}

function setBarState(i, state) {
  const bar = bars[i];
  if (!bar) return;
  bar.classList.remove('state-compare', 'state-pivot', 'state-sorted');
  if (state) bar.classList.add(`state-${state}`);
}

function highlightPair(i, j) {
  setBarState(i, 'compare');
  setBarState(j, 'compare');
}

function clearPair(i, j) {
  setBarState(i, null);
  setBarState(j, null);
}

function setPivot(i) {
  setBarState(i, 'pivot');
}

function setSorted(i) {
  setBarState(i, 'sorted');
}

function updateStatsUI() {
  el('statArraySize').textContent = String(array.length);
  el('statComparisons').textContent = String(stats.comparisons);
  el('statSwaps').textContent = String(stats.swaps + stats.moves);
  el('statTime').textContent = `${Math.floor(stats.endTime - stats.startTime)} ms`;
}

function setComplexityUI(complexity) {
  el('statComplexity').textContent = complexity;
}

function setBestWorstUI(best, worst) {
  el('statBest').textContent = best;
  el('statWorst').textContent = worst;
}

function resetCountersUI() {
  stats.comparisons = 0;
  stats.swaps = 0;
  stats.moves = 0;
  stats.startTime = 0;
  stats.endTime = 0;

  el('statComparisons').textContent = '0';
  el('statSwaps').textContent = '0';
  el('statTime').textContent = '0 ms';
}

function disableControls(disabled) {
  isSorting = !disabled;
  el('btnStart').disabled = disabled;
  el('btnGenerate').disabled = disabled;
  el('btnReset').disabled = disabled;
  el('algorithm').disabled = disabled;
  el('size').disabled = disabled;
  el('speed').disabled = disabled;
}

function algorithmInfo(algo) {
  switch (algo) {
    case 'bubble':
      return { complexity: 'O(n²)', best: 'O(n)', worst: 'O(n²)' };
    case 'selection':
      return { complexity: 'O(n²)', best: 'O(n²)', worst: 'O(n²)' };
    case 'insertion':
      return { complexity: 'O(n²)', best: 'O(n)', worst: 'O(n²)' };
    case 'merge':
      return { complexity: 'O(n log n)', best: 'O(n log n)', worst: 'O(n log n)' };
    case 'quick':
      return { complexity: 'O(n log n) avg', best: 'O(n log n)', worst: 'O(n²)' };
    default:
      return { complexity: '-', best: '-', worst: '-' };
  }
}

async function generateArray() {
  if (isSorting) return;

  const container = el('array');
  container.innerHTML = '';

  array = [];
  bars = [];

  const size = Number(el('size').value);
  el('sizeValue').textContent = String(size);
  el('statArraySize').textContent = String(size);

  for (let i = 0; i < size; i++) {
    const value = 10 + Math.floor(Math.random() * 240);
    array.push(value);

    const bar = document.createElement('div');
    bar.className = 'bar state-base';
    bar.style.height = `${value}px`;
    container.appendChild(bar);
    bars.push(bar);
  }

  resetCountersUI();
  const info = algorithmInfo(el('algorithm').value);
  setComplexityUI(info.complexity);
  setBestWorstUI(info.best, info.worst);
}

function resetVisualizer() {
  stopRequested = true;
  isSorting = false;
  stopRequested = false;
  generateArray();
}


function getSelectedAlgorithms() {
  const selected = [];
  const checkboxes = document.querySelectorAll('#algoCheckboxes input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    if (cb.checked) selected.push(cb.value);
  });
  return selected;
}


function toggleBestWorst() {
  const info = algorithmInfo(el('algorithm').value);
  setBestWorstUI(info.best, info.worst);
  setComplexityUI(info.complexity);
}

async function startSorting() {
  if (isSorting || array.length === 0) return;


  stopRequested = false;
  animationDelayMs = getSpeedDelayMs();

  const algo = el('algorithm').value;
  const info = algorithmInfo(algo);
  setComplexityUI(info.complexity);
  setBestWorstUI(info.best, info.worst);

  resetCountersUI();
  disableControls(true);

  stats.startTime = performance.now();

  try {
    switch (algo) {
      case 'bubble':
        await bubbleSort();
        break;
      case 'selection':
        await selectionSort();
        break;
      case 'insertion':
        await insertionSort();
        break;
      case 'merge':
        await mergeSort();
        break;
      case 'quick':
        await quickSort();
        break;
    }
  } finally {
    stats.endTime = performance.now();
    updateStatsUI();

    if (!stopRequested) {
      for (let i = 0; i < array.length; i++) setSorted(i);
    }

    disableControls(false);
    stopRequested = false;
  }
}

async function bubbleSort() {
  const n = array.length;
  for (let i = 0; i < n; i++) {
    if (stopRequested) return;
    for (let j = 0; j < n - i - 1; j++) {
      if (stopRequested) return;

      stats.comparisons++;
      highlightPair(j, j + 1);
      await delay();

      if (array[j] > array[j + 1]) {
        stats.swaps++;
        const tmp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = tmp;

        bars[j].style.height = `${array[j]}px`;
        bars[j + 1].style.height = `${array[j + 1]}px`;
        await delay();
      }

      clearPair(j, j + 1);
    }
  }
}

async function selectionSort() {
  const n = array.length;
  for (let i = 0; i < n; i++) {
    if (stopRequested) return;

    let min = i;
    setPivot(min);

    for (let j = i + 1; j < n; j++) {
      if (stopRequested) return;
      stats.comparisons++;

      setBarState(j, 'compare');
      await delay();

      if (array[j] < array[min]) {
        setBarState(min, null);
        min = j;
        setPivot(min);
      }

      setBarState(j, null);
    }

    if (min !== i) {
      stats.swaps++;
      const tmp = array[i];
      array[i] = array[min];
      array[min] = tmp;

      bars[i].style.height = `${array[i]}px`;
      bars[min].style.height = `${array[min]}px`;
      await delay();
    }

    setPivot(i);
    setBarState(i, null);
  }
}

async function insertionSort() {
  const n = array.length;

  for (let i = 1; i < n; i++) {
    if (stopRequested) return;

    let key = array[i];
    let j = i - 1;

    setPivot(i);
    await delay();

    while (j >= 0) {
      stats.comparisons++;
      setBarState(j, 'compare');
      await delay();

      if (array[j] > key) {
        // shift
        array[j + 1] = array[j];
        bars[j + 1].style.height = `${array[j + 1]}px`;
        stats.moves++;
        await delay();

        setBarState(j, null);
        j--;
      } else {
        setBarState(j, null);
        break;
      }
    }

    array[j + 1] = key;
    bars[j + 1].style.height = `${key}px`;
    stats.moves++;

    setPivot(i);
    setBarState(i, null);
  }
}

async function mergeSort() {
  const n = array.length;
  const aux = array.slice();

  async function sort(lo, hi) {
    if (stopRequested) return;
    if (lo >= hi) return;

    const mid = Math.floor((lo + hi) / 2);
    await sort(lo, mid);
    await sort(mid + 1, hi);
    await merge(lo, mid, hi);
  }

  async function merge(lo, mid, hi) {
    for (let k = lo; k <= hi; k++) aux[k] = array[k];

    let i = lo;
    let j = mid + 1;

    for (let k = lo; k <= hi; k++) {
      if (stopRequested) return;

      if (i <= mid) setBarState(i, 'compare');
      if (j <= hi) setBarState(j, 'compare');
      await delay();

      if (i > mid) {
        array[k] = aux[j++];
      } else if (j > hi) {
        array[k] = aux[i++];
      } else {
        stats.comparisons++;
        if (aux[i] <= aux[j]) array[k] = aux[i++];
        else array[k] = aux[j++];
      }

      bars[k].style.height = `${array[k]}px`;
      stats.moves++;
      await delay();

      // clear compare states in range (simple + readable)
      for (let idx = lo; idx <= hi; idx++) {
        if (idx !== k) setBarState(idx, null);
      }
      setBarState(k, null);
    }
  }

  await sort(0, n - 1);
}

async function quickSort() {
  const n = array.length;

  async function qs(lo, hi) {
    if (stopRequested) return;
    if (lo >= hi) return;

    const p = await partition(lo, hi);
    await qs(lo, p - 1);
    await qs(p + 1, hi);
  }

  async function partition(lo, hi) {
    const pivot = array[hi];
    setPivot(hi);
    await delay();

    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (stopRequested) return i;

      stats.comparisons++;
      setBarState(j, 'compare');
      await delay();

      if (array[j] < pivot) {
        if (i !== j) {
          stats.swaps++;
          const tmp = array[i];
          array[i] = array[j];
          array[j] = tmp;

          bars[i].style.height = `${array[i]}px`;
          bars[j].style.height = `${array[j]}px`;
          await delay();
        }
        setBarState(i, 'pivot');
        i++;
      }

      setBarState(j, null);
    }

    // place pivot at i
    stats.swaps++;
    const tmp = array[i];
    array[i] = array[hi];
    array[hi] = tmp;

    bars[i].style.height = `${array[i]}px`;
    bars[hi].style.height = `${array[hi]}px`;
    await delay();

    setPivot(i);
    await delay();
    setBarState(i, null);

    return i;
  }

  await qs(0, n - 1);
}

function wireControls() {
  const size = el('size');
  const speed = el('speed');

  el('sizeValue').textContent = String(size.value);
  el('speedValue').textContent = String(speed.value);

  size.addEventListener('input', () => {
    el('sizeValue').textContent = String(size.value);
    if (!isSorting) el('statArraySize').textContent = String(size.value);
  });

  speed.addEventListener('input', () => {
    el('speedValue').textContent = String(speed.value);
  });
}

async function compareAlgorithms() {
  if (isSorting) return;

  const selected = getSelectedAlgorithms();
  if (selected.length === 0) return;


  // Snapshot current array values (from current bars)
  const baseArray = array.slice();
  const results = [];

  // Disable animation during compare

  disableControls(true);

  const prevDelay = animationDelayMs;
  // Use fastest mode for benchmarking (minimize DOM/animation cost)
  animationDelayMs = 0;


  try {
    for (const algo of selected) {
      if (stopRequested) break;

      // run each algorithm on its own copy and measure real time
      // IMPORTANT: for benchmark run, do not touch DOM/bars at all.
      const arrCopy = baseArray.slice();

      const originalArray = array;
      const originalBars = bars;

      array = arrCopy;
      // create a temporary bars array for counting/highlighting? We'll just not animate for speed.
      bars = [];

      const start = performance.now();
      stats.comparisons = 0;
      stats.swaps = 0;
      stats.moves = 0;

      // Use a lightweight run: skip animation delay and highlighting
      stopRequested = false;


      if (algo === 'bubble') await bubbleSort();
      else if (algo === 'selection') await selectionSort();
      else if (algo === 'insertion') await insertionSort();
      else if (algo === 'merge') await mergeSort();
      else if (algo === 'quick') await quickSort();

      const end = performance.now();
      animationDelayMs = savedDelay;

      // restore
      array = originalArray;
      bars = originalBars;

      results.push({ algo, timeMs: Math.max(0, end - start) });

      // reapply animations back to main array for the user
      // (no DOM changes during compare)
      el('statComplexity').textContent = algorithmInfo(algo).complexity;
      el('statTime').textContent = `${Math.floor(end - start)} ms`;
    }
  } finally {
    animationDelayMs = prevDelay;
    disableControls(false);
  }

  // Sort by time
  results.sort((a, b) => a.timeMs - b.timeMs);

  // Show results in the existing stats area best/worst slots
  // (keep UI minimal; user still can read actual timings)
  el('statBest').textContent = results.map(r => `${r.algo}: ${Math.floor(r.timeMs)}ms`).join(' | ');
  el('statWorst').textContent = `Fastest: ${results[0]?.algo ?? '-'} ; Slowest: ${results[results.length-1]?.algo ?? '-'} `;

  // restore theoretical for currently selected algorithm dropdown
  const info = algorithmInfo(el('algorithm').value);
  setComplexityUI(info.complexity);
  setBestWorstUI(info.best, info.worst);
}

wireControls();
generateArray();



