import * as request from 'request-promise';

import Kodi from './Kodi.js';

import Promise from 'bluebird';

const config = require('../api_options.json');

console.log('Starting');

const kodi = new Kodi();

kodi.connect();

kodi.api.on('notification:update', async (data) => {
  console.log('notification:onasdfsdgsghUpdate', data.params.data);
  if (data.params.data && data.params.data.playcount > 0) {
    kodi.getShowIMDBIdFromEpisodeId(data.params.data.item.id, (episode) => {
      console.log('Episode Info: ', episode);
    });
  }
});

const test = async () => {
  kodi.getShowIMDBIdFromEpisodeId(13, (imdb) => {
    console.log('show for episode 13:', imdb);
  });
};

test();

process.on("unhandledRejection", function(reason, promise) {
  console.log('Unhandled rejection:', reason, promise);
});
