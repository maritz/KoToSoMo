### Description

This is a small service that listens to your Kodi when you watched an episode (or marked it as watched/unwatched) and syncs your monitored status in Sonarr. 
This way Sonarr won't download things you've already seen.

### Running

```
npm install --production && nvm run build && node dist/index.js
```

### Development

```
npm install && nvm run start-dev
```

##### Why not just a Kodi plugin?
Too lazy to learn Kodi plugin development stuff, plus this way it can run on a different machine. Some Kodi installs run on crazy environments.
