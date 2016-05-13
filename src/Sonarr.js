import Request from 'request-promise';

const debug = require('debug')('kotosomo:Sonarr');

const config = require('../api_options.json');
const base_url = `http://${config.sonarr.host}:${config.sonarr.port}/api`;

class Sonarr {

  constructor() {
    this.getShows();
  }

  url(path) {
    let url = `${base_url}/${path}`;
    if (path.indexOf('?') === -1) {
      url += '?';
    }
    url += `&apikey=${config.sonarr.api_key}`;
    return url;
  }

  get(path) {
    const url = this.url(path);
    debug('making GET request', url);
    return Request.get({ url: url, json: true });
  }

  put(path, body) {
    const url = this.url(path);
    debug('making PUT request', url, body);
    return Request.put({ url: url, body: body, json: true });
  }

  async getShows() {
    this.showsByTVDB = {};
    const temp_shows = await this.get('/series');
    temp_shows.forEach((show) => {
      this.showsByTVDB[show.tvdbId] = show;
    });
    return this.showsByTVDB;
  }

  async getShowByTVDBId(id) {
    if (!this.showsByTVDB[id]) {
      await this.getShows();
    }
    return this.showsByTVDB[id];
  }

  async getEpisodes(showid) {
    return await this.get(`/episode?seriesId=${showid}`);
  }

  async getEpisodesByTVDBId(tvdbid) {
    const show = await this.getShowByTVDBId(tvdbid);
    return this.getEpisodes(show.id);
  }

  async getSpecificEpisodeByTVDBId(tvdbid, season_number, episode_number) {
    season_number = parseInt(season_number, 10);
    episode_number = parseInt(episode_number, 10);
    const episodes = await this.getEpisodesByTVDBId(tvdbid);
    return episodes.find((episode) => {
      return episode.seasonNumber === season_number && episode.episodeNumber === episode_number;
    });
  }

  async setMonitoredEpisode(episode) {
    episode.monitored = true;
    return await this.put('/episode', episode);
  }

  async unsetMonitoredEpisode(episode) {
    episode.monitored = false;
    return await this.put('/episode', episode);
  }

}


export default Sonarr;