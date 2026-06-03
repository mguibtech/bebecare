/**
 * Playback service do react-native-track-player (Modo Soninho).
 *
 * Registrado em index.js (TrackPlayer.registerPlaybackService). Roda no escopo
 * nativo e trata os controles remotos (notificacao/lockscreen). Mantido minimo:
 * o Modo Soninho so toca/pausa/para.
 */

module.exports = async function () {
  const TrackPlayer = require('react-native-track-player').default;
  const { Event } = require('react-native-track-player');

  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());
};
