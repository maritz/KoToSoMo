import * as request from 'request-promise';

import Kodi from './Kodi.js';

const config = require('../api_options.json');

console.log('Starting');

const kodi = new Kodi();

kodi.connect();

kodi.on('episode', (data) => {
  console.log('Episode starting: ', data);
});
