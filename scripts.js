// SPA Routing Logic
function navigate(sectionId) {
  // Update Links
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
  
  // Update Sections
  document.querySelectorAll('.section-container').forEach(el => {
    el.classList.remove('active');
    void el.offsetWidth; // Force re-flow to restart CSS animations
  });
  document.getElementById(sectionId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Tooltip Copy Logic
function copyEmail(e, email) {
  e.preventDefault();
  navigator.clipboard.writeText(email).then(() => {
    const el = e.currentTarget;
    const originalHTML = el.innerHTML;
    el.innerHTML = 'Copied! <i class="fa-solid fa-check"></i>';
    setTimeout(() => { el.innerHTML = originalHTML; }, 2000);
  });
}

// BibTeX Modal Logic
const modal = document.getElementById('bibtexModal');
const modalText = document.getElementById('bibtexText');
const copyBtn = document.getElementById('copyBtn');
const closeBtn = document.getElementById('closeModal');

document.querySelectorAll('.bibtex-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    modalText.textContent = btn.getAttribute('data-bibtex');
    modal.style.display = 'flex';
  });
});

function closeModal() {
  modal.style.display = 'none';
  copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy to Clipboard';
}
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(modalText.textContent).then(() => {
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
  });
});

// Complex Canvas 3-Stage Animation (Super-Res -> Diffusion Noise -> Gaussian Splatting)
(function initAIAnimation() {
  const canvas = document.getElementById('aiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width, H = canvas.height;
  
  const offCanvas = document.createElement('canvas');
  offCanvas.width = W; offCanvas.height = H;
  const octx = offCanvas.getContext('2d');
  
  const img = new Image();
  img.src = 'assets/ok.png';
  
  let animationFrameId;
  let frameCount = 0;
  
  img.onload = () => {
    // Calculate aspect ratio to crop center
    const scale = Math.max(W / img.width, H / img.height);
    const x = (W / 2) - (img.width / 2) * scale * 0.975;
    const y = (H / 2) - (img.height / 2) * scale * 0.75;
    octx.drawImage(img, x, y, img.width * scale, img.height * scale);
    octx.font = '800 36px Schibsted Grotesk';
    octx.fillStyle = '#ffffff';
    octx.textAlign = 'center';
    requestAnimationFrame(renderLoop);
  };
  
  img.onerror = () => {
    octx.fillStyle = '#151A23'; octx.fillRect(0, 0, W, H);
    octx.font = '800 40px Schibsted Grotesk';
    octx.fillStyle = '#4A6FFF'; octx.textAlign = 'center';
    octx.fillText('ONUR', W/2, H/2);
    requestAnimationFrame(renderLoop);
  };

  function drawPixelated(blockSize) {
    if (blockSize <= 1) { ctx.drawImage(offCanvas, 0, 0); return; }
    const temp = document.createElement('canvas');
    temp.width = Math.ceil(W / blockSize); temp.height = Math.ceil(H / blockSize);
    const tctx = temp.getContext('2d');
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(offCanvas, 0, 0, temp.width, temp.height);
    
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, W, H);
  }

  function drawNoisy(alpha) {
    ctx.drawImage(offCanvas, 0, 0);
    if(alpha <= 0) return;
    const imgData = ctx.getImageData(0,0,W,H);
    const data = imgData.data;
    for(let i=0; i<data.length; i+=4) {
      const noise = (Math.random() - 0.5) * 255 * alpha;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const splats = [];
  for(let i=0; i<150; i++){
    splats.push({ x: Math.random() * W, y: Math.random() * H, maxR: 15 + Math.random() * 75, offset: Math.random() * 100 });
  }

  function drawSplats(progress, isDestruct) {
    ctx.drawImage(offCanvas, 0, 0);
    ctx.globalCompositeOperation = isDestruct ? 'destination-out' : 'source-over';
    
    if(!isDestruct) { ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation = 'source-over'; }

    splats.forEach(s => {
      let r = Math.max(0, (progress * 150) - s.offset);
      r = Math.min(r, s.maxR);
      
      if (r > 0) {
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI*2); ctx.fill();
      }
    });

    if(!isDestruct) { ctx.globalCompositeOperation = 'source-in'; ctx.drawImage(offCanvas, 0, 0); }
    ctx.globalCompositeOperation = 'source-over';
  }

  function renderLoop() {
    frameCount++;
    const cycle = frameCount % 1100; 

    if (cycle < 150) { drawPixelated(Math.max(1, (cycle / 150) * 30)); }
    else if (cycle < 300) { drawPixelated(Math.max(1, 30 - (cycle / 300 * 30))); }
    else if (cycle < 400) { drawPixelated(1); }
    else if (cycle < 500) { drawNoisy((cycle - 400) / 25); }
    else if (cycle < 600) { drawNoisy(4 - ((cycle - 500) / 25)); }
    else if (cycle < 700) { drawNoisy(0); }
    else if (cycle < 850) { drawSplats((cycle - 700) / 150, true); }
    else if (cycle < 1000) { drawSplats((cycle - 850) / 150, false); }
    else { drawPixelated(1); }

    animationFrameId = requestAnimationFrame(renderLoop);
  }
})();
