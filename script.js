const audio = document.getElementById('audio');
const fileInput = document.getElementById('audioFiles');
const trackList = document.getElementById('trackList');
const emptyState = document.getElementById('emptyState');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const playBtn = document.getElementById('playBtn');
const seekBar = document.getElementById('seekBar');
const volumeBar = document.getElementById('volumeBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const trackCount = document.getElementById('trackCount');
const favoriteBtn = document.getElementById('favoriteBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');

let tracks = [];
let currentIndex = -1;
let shuffle = false;
let repeat = false;
let favorites = new Set();

const formatTime = seconds => {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

function addFiles(files) {
  const audioFiles = [...files].filter(file => file.type.startsWith('audio/'));
  audioFiles.forEach(file => tracks.push({
    file,
    title: file.name.replace(/\.[^/.]+$/, ''),
    artist: 'Local audio file',
    url: URL.createObjectURL(file)
  }));
  renderPlaylist();
  if (currentIndex === -1 && tracks.length) loadTrack(0);
}

function renderPlaylist() {
  trackCount.textContent = tracks.length;
  emptyState.hidden = tracks.length > 0;
  trackList.innerHTML = '';
  tracks.forEach((track, index) => {
    const item = document.createElement('li');
    item.className = `track-item ${index === currentIndex ? 'active' : ''}`;
    item.innerHTML = `
      <span class="track-number">${index === currentIndex ? '♫' : String(index + 1).padStart(2, '0')}</span>
      <span class="mini-cover">♫</span>
      <span class="track-meta"><strong></strong><small>${track.artist}</small></span>
      <span class="track-duration">${index === currentIndex && Number.isFinite(audio.duration) ? formatTime(audio.duration) : 'AUDIO'}</span>`;
    item.querySelector('strong').textContent = track.title;
    item.addEventListener('click', () => loadTrack(index, true));
    trackList.appendChild(item);
  });
}

function loadTrack(index, autoplay = false) {
  if (!tracks.length) return;
  currentIndex = (index + tracks.length) % tracks.length;
  const track = tracks[currentIndex];
  audio.src = track.url;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  seekBar.value = 0;
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '0:00';
  favoriteBtn.classList.toggle('active', favorites.has(currentIndex));
  favoriteBtn.textContent = favorites.has(currentIndex) ? '♥' : '♡';
  renderPlaylist();
  if (autoplay) playTrack();
}

function playTrack() {
  if (currentIndex < 0 && tracks.length) loadTrack(0);
  if (!audio.src) return;
  audio.play().then(() => { playBtn.textContent = 'Ⅱ'; }).catch(() => {
    playBtn.textContent = '▶';
  });
}
function pauseTrack() { audio.pause(); playBtn.textContent = '▶'; }
function nextTrack() {
  if (!tracks.length) return;
  let next = currentIndex + 1;
  if (shuffle && tracks.length > 1) {
    do { next = Math.floor(Math.random() * tracks.length); } while (next === currentIndex);
  }
  loadTrack(next, true);
}
function previousTrack() {
  if (!tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  loadTrack(currentIndex - 1, true);
}

fileInput.addEventListener('change', event => {
  addFiles(event.target.files);
  event.target.value = '';
});
playBtn.addEventListener('click', () => audio.paused ? playTrack() : pauseTrack());
document.getElementById('nextBtn').addEventListener('click', nextTrack);
document.getElementById('prevBtn').addEventListener('click', previousTrack);
shuffleBtn.addEventListener('click', () => {
  shuffle = !shuffle;
  shuffleBtn.classList.toggle('active', shuffle);
});
repeatBtn.addEventListener('click', () => {
  repeat = !repeat;
  repeatBtn.classList.toggle('active', repeat);
  audio.loop = repeat;
});
favoriteBtn.addEventListener('click', () => {
  if (currentIndex < 0) return;
  if (favorites.has(currentIndex)) favorites.delete(currentIndex);
  else favorites.add(currentIndex);
  favoriteBtn.classList.toggle('active', favorites.has(currentIndex));
  favoriteBtn.textContent = favorites.has(currentIndex) ? '♥' : '♡';
});
volumeBar.addEventListener('input', () => { audio.volume = Number(volumeBar.value); });
audio.volume = Number(volumeBar.value);
audio.addEventListener('timeupdate', () => {
  if (!Number.isFinite(audio.duration)) return;
  seekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
  renderPlaylist();
});
seekBar.addEventListener('input', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
});
audio.addEventListener('ended', () => {
  if (!repeat) nextTrack();
});
audio.addEventListener('play', () => { playBtn.textContent = 'Ⅱ'; });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });
window.addEventListener('keydown', event => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (event.code === 'Space') { event.preventDefault(); audio.paused ? playTrack() : pauseTrack(); }
  if (event.code === 'ArrowRight' && Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
  if (event.code === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
});
window.addEventListener('beforeunload', () => tracks.forEach(track => URL.revokeObjectURL(track.url)));
