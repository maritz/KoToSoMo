import * as xbmc from 'xbmc';
import bunyan from 'bunyan';

import log from './logger.js';

const config = require('../api_options.json');

const incr_backoff_factor = config.kodi.incremental_backoff_factor || 1.5;
const incr_backoff_max = config.kodi.incremental_backoff_max || 60000;

class Kodi {

  constructor() {
    this.api = new xbmc.XbmcApi();
    this.incr_backoff = 5000;

    this.shows = {};

    this.api.on('connection:open', () => {
      this.incr_backoff = 5000;
      log.info('Kodi: Connected.');
      this.getShows();
    });

    this.api.on('connection:close', () => {
      if (!this.api.connection.socket.connecting) {
        log.warn('Kodi: Lost connnection.');
        this.handleDisconnect();
      }
    });
  }

  connect() {
    const connection = new xbmc.TCPConnection({
      host: config.kodi.host,
      port: config.kodi.port,
      verbose: true,
    });

    this.api.setConnection(connection);

    this.api.connection.parser.onerror = () => {
      return function (ex) {
        if (ex.message.indexOf("Unexpected end") === 0 && this.api.connection.connecting) {
          // noop this is some weird bug...
          log.warn("Kodi: ignored errror", ex.message)
        } else {
          log.error(ex.message)
          throw new Error("JSON parse error: " + ex);
        }
      };
    };

    // we dont want to wait forever for a potentially non-running kodi. Just try again with the incr_backoff
    connection.socket.setTimeout(3000, (data) => {
      if (connection.socket.connecting) {
        log.warn('Kodi: Connection took too long to establish, disconnecting.');
        this.api.disconnect();
        this.handleDisconnect();
      }
    });
  }

  handleDisconnect() {
    log.info(`Kodi: Retrying connection in ${this.incr_backoff}ms.`);

    setTimeout(() => this.connect(), this.incr_backoff);

    this.incr_backoff *= incr_backoff_factor;
    if (this.incr_backoff > incr_backoff_max) {
      this.incr_backoff = incr_backoff_max;
    }
  }

  getShows(cb) {
    let count;
    let done_called = false;
    const done = () => {
      if (done_called) {
        return;
      }

      if (--count <= 0) {
        done_called = true;
        if (typeof cb === 'function') {
          cb(null, this.shows);
        }
      }
    }
    this.api.media.tvshows(null, (shows) => {
      this.shows = {};
      count = shows.length;
      shows.forEach((show) => {
        this.api.media.tvshow(show.tvshowid, {properties: ['imdbnumber']}, (details) => {
          this.shows[show.label] = details;
          done();
        });
      });
    });
  }


  getShowFromEpisodeId(episodeid, cb) {
    this.api.media.episode(episodeid, null, (episode) => {
      const done = () => {
        if (this.shows[episode.showtitle]) {
          cb(null, this.shows[episode.showtitle]);
        } else {
          cb(new Error(`No show found for the id "${episodeid}".`));
        }
      }
      if (this.shows[episode.showtitle]) {
        done();
      } else {
        this.getShows(done);
      }
    });
  }

  // for some reason it's called imdb number in kodi even though it most definitely is the tvdb id, at least for tv shows
  getShowTVDBIdFromEpisodeId(episodeid, cb) {
    this.getShowFromEpisodeId(episodeid, (err, show) => {
      cb(null, show.imdbnumber)
    });
  }

  getEpisodeDetails(episodeid, cb) {
    this.api.media.episode(episodeid, null, (episode) => {
      cb(null, episode);
    });
  }

}


export default Kodi;