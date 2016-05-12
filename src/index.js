import * as request from 'request-promise';
import * as xbmc from 'xbmc';

const config = require('../api_options.json');

console.log('Starting');

let kodi_incr_backoff = 5000;
const kodi_incr_backoff_factor = config.kodi.incremental_backoff_factor || 1.5;
const kodi_incr_backoff_max = config.kodi.incremental_backoff_max || 60000;

const connectKodi = () => {

  const connection = new xbmc.TCPConnection({
    host: config.kodi.host,
    port: config.kodi.port,
    verbose: true,
  });

  const xbmcApi = new xbmc.XbmcApi();

  xbmcApi.setConnection(connection);

  const handleDisconnect = () => {

    console.log(`Lost connection to Kodi, retrying in ${kodi_incr_backoff}ms.`);

    xbmcApi.disconnect(() => {
      setTimeout(connectKodi, kodi_incr_backoff);

      kodi_incr_backoff *= kodi_incr_backoff_factor;
      if (kodi_incr_backoff > kodi_incr_backoff_max) {
        kodi_incr_backoff = kodi_incr_backoff_max;
      }
    });
  };

  // we dont want to wait forever for a potentially non-running kodi. Just try again with the incr_backoff
  connection.socket.setTimeout(3000, function (data) {
    if (connection.socket.connecting) {
      console.log('Connection took too long to establish, disconnecting.');
      handleDisconnect();
    }
  });

  xbmcApi.on('connection:close', handleDisconnect);

  xbmcApi.on('connection:open', () => console.log('Connected to Kodi.'));


  xbmcApi.on('api:episode', (details) => console.log('onEpisode', details));
  xbmcApi.on('api:playerStopped', (details) => console.log('onPlayerStopped', details));

  xbmcApi.on('notification:play', () => console.log('notification:onPlay'));
  xbmcApi.on('notification:pause', () => console.log('notification:onPause'));
  xbmcApi.on('notification:add', () => console.log('notification:onPause'));
  xbmcApi.on('notification:update', () => console.log('notification:onPause'));
  xbmcApi.on('notification:clear', () => console.log('notification:onPause'));
  xbmcApi.on('notification:scanstarted', () => console.log('notification:onPause'));
  xbmcApi.on('notification:scanfinished', () => console.log('notification:onPause'));
  xbmcApi.on('notification:screensaveractivated', () => console.log('notification:onPause'));
  xbmcApi.on('notification:screensaverdeactivated', () => console.log('notification:onPause'));
};

connectKodi();
