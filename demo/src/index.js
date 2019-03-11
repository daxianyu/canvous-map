import { MultiLayer, MassMarks } from 'canvous-map/core';
import generateMarkData from './generateMassMarks';

const { Layer } = MultiLayer;
const app = document.getElementById('app');

const layer = new Layer({
  fitSize: true,
});
const multiLayer = new MultiLayer(app, {
  height: 700,
  width: 700,
});
multiLayer.addLayer(layer);

const massMark = new MassMarks(layer.ctx, {
  data: generateMarkData({
    ...layer.getSize(),
    colCount: 120,
    rowCount: 120,
  }),
  radius: 2,
});

massMark.start();
