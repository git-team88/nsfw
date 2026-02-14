const setRemUnit = () => {
  let fit_w = 750;
  let fit_h = 1284;

  if (innerWidth > 0) {
    fit_w = 1440;
    fit_h = 900;
  }

  let size_w = (innerWidth / fit_w) * 10;
  let size_h = (innerHeight / fit_h) * 10;

  window.fitSize = Math.min(size_w, size_h);
  document.documentElement.style.fontSize = `${fitSize}px`;
}

document.addEventListener('DOMContentLoaded', setRemUnit, false);

window.addEventListener('resize', setRemUnit, false);

export default setRemUnit;
