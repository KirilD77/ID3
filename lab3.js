const { log2: lg } = Math;
const { log } = console;

const unpreparedDataset = [
  'погана малий адекватна 15-35 помірний',
  'невідома малий адекватна 0-15 помірний',
  'хороша значний адекватна 0-15 високий',
  'невідома значний відсутня понад35 помірний',
  'погана значний відсутня 0-15 високий',
  'невідома значний адекватна 15-35 помірний',
  'хороша малий відсутня 15-35 низький',
  'невідома малий адекватна понад35 низький',
  'хороша малий відсутня 0-15 високий',
  'погана малий відсутня 15-35 помірний',
  'невідома значний адекватна понад35 помірний',
  'невідома малий відсутня 15-35 високий',
  'невідома малий відсутня 0-15 високий',
  'хороша значний адекватна 15-35 помірний',
  'хороша малий адекватна понад35 низький',
  'погана малий адекватна понад35 помірний',
  'погана значний відсутня понад35 помірний',
  'хороша малий адекватна 0-15 помірний',
  'погана малий відсутня понад35 помірний',
  'погана малий відсутня 0-15 високий'
];

/* const unpreparedDataset = [
  'sunny hot high weak no',
  'sunny hot high strong no',
  'overcast hot high weak yes',
  'rain mild high weak yes',
  'rain cool normal weak yes',
  'rain cool normal strong no',
  'overcast cool normal strong yes',
  'sunny mild high weak no',
  'sunny cool normal weak yes',
  'rain mild normal weak yes',
  'sunny mild normal strong yes',
  'overcast mild high strong yes',
  'overcast hoot normal weak yes',
  'rain mild high strong no'
]; */

const dataset = unpreparedDataset.map((row) => row.split(' '));
const columns = [
  'Кредитна історія',
  'Наявність кредиту',
  'Наявність застави',
  'Величина доходів',
  'Ризик надання кредиту'
];
/* const columns = ['outlook', 'temp', 'humidity', 'wind', 'play tennis']; */

const calcEntropy = (values) => {
  const calcLg = (val) => (lg(val) === -Infinity ? 0 : lg(val));
  const sum = values.reduce((acc, cur) => acc + cur, 0);
  values = values.map((el) => el / sum);
  return values.reduce(
    (acc, cur, i) => (i === 0 ? acc : acc - cur * calcLg(cur)),
    -values[0] * calcLg(values[0])
  );
};

const prepareForEntropy = (arr) => {
  const leftToFill = 3 - arr.length;
  const toReturn = [...arr];
  for (let i = 0; i < leftToFill; i++) {
    toReturn.push(0);
  }
  return toReturn;
};

const calcFrequency = (values) =>
  values.reduce((acc, cur) => {
    if (acc[cur]) {
      acc[cur]++;
    } else {
      acc[cur] = 1;
    }
    return acc;
  }, {});

const valueToIndexes = (values) => {
  return values.reduce((acc, cur, i) => {
    if (!acc[cur]) {
      acc[cur] = [i];
    } else {
      acc[cur].push(i);
    }
    return acc;
  }, {});
};
const classes = dataset.map((row) => row[row.length - 1]);
const classesFrequency = calcFrequency(classes);
const entropyOfDataset = calcEntropy(Object.values(classesFrequency));

const calcBiggestGain = (_dataset, columns) => {
  const rowLength = _dataset[0].length;
  let maxIdx = 0;
  let max = -Infinity;
  const columnsInfo = [];
  const classes = _dataset.map((row) => row[row.length - 1]);
  const classesFrequency = calcFrequency(classes);
  const entropyOfDataset = calcEntropy(Object.values(classesFrequency));

  for (let i = 0; i < rowLength - 1; i++) {
    const columnName = columns[i];
    const columnContent = _dataset.map((el) => el[i]);
    const columnValueToIndexes = valueToIndexes(columnContent);
    const columnInfo = [];
    let infoGained = entropyOfDataset;

    for (let column in columnValueToIndexes) {
      let indexes = columnValueToIndexes[column];

      const _columnInfo = {};
      _columnInfo.value = column;
      _columnInfo.indexes = indexes;
      _columnInfo.frequencies = {};

      for (let j = 0; j < indexes.length; j++) {
        const idx = indexes[j];
        const classValue = classes[idx];
        if (!_columnInfo.frequencies[classValue]) {
          _columnInfo.frequencies[classValue] = 1;
        } else {
          _columnInfo.frequencies[classValue] += 1;
        }
      }
      const _frequency = prepareForEntropy(
        Object.values(_columnInfo.frequencies)
      );
      _columnInfo.entropy = calcEntropy(_frequency);
      columnInfo.push(_columnInfo);

      infoGained -=
        (Object.values(_columnInfo.frequencies).reduce(
          (acc, cur) => acc + cur,
          0
        ) /
          _dataset.length) *
        _columnInfo.entropy;
    }

    columnsInfo.push({
      column: columnName,
      infoGained,
      columnInfo
    });

    if (infoGained > max) {
      max = infoGained;
      maxIdx = i;
    }
  }

  return [columnsInfo[maxIdx], maxIdx];
};

const deleteFromArr = (arr, idx) => {
  const _arr = [...arr];
  _arr.splice(idx, 1);
  return _arr;
};

const tree = [];
const buildTree = (dataset, tree, column, branchValue, parentRoot) => {
  const [root, idxToDelete] = calcBiggestGain(dataset, column);
  const name = root.column;
  tree.push({
    root,
    rootName: name,
    branchValue,
    parentRoot
  });

  for (let i = 0; i < root.columnInfo.length; i++) {
    const { frequencies, indexes, value } = root.columnInfo[i];
    if (Object.keys(frequencies).length !== 1) {
      const _dataset = [];
      indexes.forEach((_, j) => {
        _dataset.push(
          dataset[indexes[j]].filter((_, idx) => idx !== idxToDelete)
        );
      });
      buildTree(
        _dataset,
        tree,
        deleteFromArr(column, idxToDelete),
        value,
        name
      );
    } else {
      tree.push({ type: 'leaf', frequencies, parentRoot: name, value });
    }
  }

  return tree;
};

buildTree(dataset, tree, columns, '', '');
log(tree);
