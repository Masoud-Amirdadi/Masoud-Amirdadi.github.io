// Full-size event photos, with native dialog focus management and Escape support.
const photoViewer = document.querySelector('.photo-viewer');
if (photoViewer) {
  const photo = photoViewer.querySelector('img');
  const caption = photoViewer.querySelector('#photo-caption');
  document.querySelectorAll('.gallery-photo').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      photo.src = link.href;
      photo.alt = link.querySelector('img').alt;
      caption.textContent = link.dataset.caption;
      photoViewer.showModal();
    });
  });
  photoViewer.querySelector('.photo-close').addEventListener('click', () => photoViewer.close());
  photoViewer.addEventListener('click', event => {
    if (event.target === photoViewer) {
      const rect = photoViewer.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) photoViewer.close();
    }
  });
}

// Choose one research theme, with keyboard navigation and direct-link support.
const projectGroup = document.querySelector('.projects');
if (projectGroup) {
  const panels = Array.from(projectGroup.querySelectorAll(':scope > section'));
  const tabs = document.createElement('div');
  tabs.className = 'project-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Research projects');
  const buttons = panels.map(panel => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `tab-${panel.id}`;
    const number = document.createElement('span');
    number.className = 'project-tab-number';
    number.textContent = String(panels.indexOf(panel) + 1).padStart(2, '0');
    const title = document.createElement('span');
    title.textContent = panel.querySelector('h3').textContent;
    button.append(number, title);
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;
    tabs.append(button);
    return button;
  });
  projectGroup.before(tabs);
  function selectProject(index, updateUrl = false) {
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      buttons[i].setAttribute('aria-selected', String(i === index));
      buttons[i].tabIndex = i === index ? 0 : -1;
      if (panel.hidden) panel.querySelectorAll('video').forEach(video => video.pause());
    });
    if (updateUrl) history.replaceState(null, '', `#${panels[index].id}`);
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectProject(index, true));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectProject(next, true);
        buttons[next].focus();
      }
    });
  });
  function selectFromHash() {
    const index = panels.findIndex(panel => `#${panel.id}` === location.hash);
    selectProject(index >= 0 ? index : 0);
  }
  selectFromHash();
  window.addEventListener('hashchange', selectFromHash);
}

const motionButton = document.getElementById('motion-toggle');
if (motionButton) {
  const demo = motionButton.closest('.demo');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    demo.classList.add('paused');
    motionButton.textContent = 'Animation paused (reduced motion)';
    motionButton.disabled = true;
    motionButton.setAttribute('aria-pressed', 'true');
  }
  motionButton.addEventListener('click', () => {
    const paused = demo.classList.toggle('paused');
    motionButton.textContent = paused ? 'Play animation' : 'Pause animation';
    motionButton.setAttribute('aria-pressed', String(paused));
  });
}

// Lightweight looping videos load only on demand, within the selected project.
const reducedStudyMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.study-animation').forEach(figure => {
  const video = figure.querySelector('video');
  const button = figure.querySelector('.gif-toggle');
  if (!video || !button) return;
  let userPaused = false;
  function updateButton() {
    const playing = !video.paused;
    button.textContent = playing ? 'Pause Animation' : 'Play Animation';
    button.setAttribute('aria-pressed', String(playing));
  }
  function play() {
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.muted = true;
    video.play().catch(updateButton);
  }
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  button.addEventListener('click', () => {
    userPaused = !video.paused;
    if (userPaused) video.pause(); else play();
  });
  const panel = figure.closest('[role="tabpanel"]');
  function syncVisibility() {
    if (panel?.hidden || reducedStudyMotion.matches || userPaused) video.pause();
    else play();
    updateButton();
  }
  reducedStudyMotion.addEventListener('change', syncVisibility);
  if (panel) new MutationObserver(syncVisibility).observe(panel, {attributes:true, attributeFilter:['hidden']});
  syncVisibility();
});
