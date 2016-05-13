import * as request from 'request-promise';

import Kodi from './Kodi.js';
import Sonarr from './Sonarr.js';
import log from './logger.js';

const config = require('../api_options.json');


log.info('Starting');

const sonarr = new Sonarr();

const kodi = new Kodi();

kodi.connect();

kodi.api.on('notification:update', async (data) => {

  if (data.params.data) {
    kodi.getShowTVDBIdFromEpisodeId(data.params.data.item.id, (err, imdb) => {
      kodi.getEpisodeDetails(data.params.data.item.id, async (err, episode) => {

        const episode_to_set = await sonarr.getSpecificEpisodeByTVDBId(imdb, episode.season, episode.episode);
        if (data.params.data.playcount > 0) {
          log.info(`Setting ${episode.showtitle} S${episode.season}E${episode.episode} to NOT monitored.`);
          sonarr.unsetMonitoredEpisode(episode_to_set);
        } else {
          log.info(`Setting ${episode.showtitle} S${episode.season}E${episode.episode} to monitored.`);
          sonarr.setMonitoredEpisode(episode_to_set);
        }
      });
    });
  }
});


process.on("unhandledRejection", function(reason, promise) {
  log.error('Unhandled rejection:', reason, promise);
});
