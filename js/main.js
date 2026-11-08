(function () {
  // The real site lives on sandracuello.com; anywhere else (local file, claude.ai preview) forms don't send anything.
  const IS_LIVE = /(^|\.)sandracuello\.com$/.test(location.hostname);

  // ---------- Open every page at the top (or at its #section) instead of a remembered scroll position ----------
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  const goToStart = () => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  };
  let userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, () => { userMoved = true; }, { once: true, passive: true }));
  goToStart();
  addEventListener('load', () => { if (!userMoved) goToStart(); }, { once: true });
  addEventListener('pageshow', e => { if (e.persisted) goToStart(); });

  // ---------- Menu: mobile toggle and dropdowns ----------
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Cerrar' : 'Menú';
    });
  }
  document.querySelectorAll('.has-sub > button').forEach(btn => {
    btn.addEventListener('click', () => {
      const li = btn.parentElement;
      const open = !li.classList.contains('open');
      document.querySelectorAll('.has-sub.open').forEach(o => { o.classList.remove('open'); o.firstElementChild.setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.has-sub')) document.querySelectorAll('.has-sub.open').forEach(o => { o.classList.remove('open'); o.firstElementChild.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.has-sub.open').forEach(o => { o.classList.remove('open'); o.firstElementChild.setAttribute('aria-expanded', 'false'); o.firstElementChild.focus(); });
  });

  // ---------- Newsletter forms (Systeme.io) ----------
  // Thank-you pop-up shown after signing up (the rest of the page is dimmed behind it)
  const showThanks = () => {
    let dlg = document.getElementById('nl-thanks');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'nl-thanks';
      dlg.className = 'nl-thanks';
      dlg.setAttribute('aria-labelledby', 'nl-thanks-title');
      dlg.innerHTML = '<p class="tracked">Newsletter</p><h2 id="nl-thanks-title">¡Gracias! <span>Ya estás dentro</span></h2><p>Revisa tu correo: ahí te llegará la próxima newsletter.</p><button type="button" class="btn btn-accent">Cerrar</button>';
      dlg.querySelector('button').addEventListener('click', () => dlg.close());
      dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.showModal();
    dlg.querySelector('button').focus();
  };
  document.querySelectorAll('form[data-newsletter]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const done = () => { form.reset(); button.disabled = false; button.textContent = button.dataset.label; showThanks(); };
      button.dataset.label = button.dataset.label || button.textContent;
      if (!IS_LIVE) { done(); return; } // test address: same pop-up, nothing is sent to Systeme.io
      // Send the form into a hidden frame, so the visitor stays on sandracuello.com
      // (Systeme.io redirects to its own thank-you page on denaturalezasalvaje.com, which loads inside the frame).
      let frame = document.getElementById('nl-frame');
      if (!frame) {
        frame = document.createElement('iframe');
        frame.name = frame.id = 'nl-frame';
        frame.title = 'Envío de la newsletter';
        frame.hidden = true;
        document.body.appendChild(frame);
      }
      form.target = 'nl-frame';
      frame.onload = done;
      button.disabled = true;
      button.textContent = 'Enviando…';
      HTMLFormElement.prototype.submit.call(form);
    });
  });

  // ---------- Guías y planes: no hay pago conectado todavía ----------
  document.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', () => {
    document.getElementById('guide-msg').hidden = false;
  }));

  // ---------- Contact form ----------
  const contact = document.getElementById('contact-form');
  if (contact) {
    contact.addEventListener('submit', e => {
      e.preventDefault();
      const status = document.getElementById('contact-status');
      status.hidden = false;
      status.textContent = IS_LIVE
        ? 'Gracias, tu mensaje ha llegado. Te responderé lo antes posible.'
        : 'Esto es una vista previa: en la web publicada, tu mensaje llegará al email de Sandra.';
    });
  }

  // ---------- Copy email ----------
  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('email-text');
      const done = () => { copyBtn.textContent = 'Copiado'; setTimeout(() => { copyBtn.textContent = 'Copiar email'; }, 2000); };
      const fallback = () => {
        const r = document.createRange(); r.selectNodeContents(text);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        copyBtn.textContent = 'Seleccionado: pulsa Ctrl+C';
      };
      try { navigator.clipboard.writeText(text.textContent.trim()).then(done, fallback); } catch (err) { fallback(); }
    });
  }

  // ---------- Blog filter: blog.html#montana / #bici ----------
  const posts = document.querySelectorAll('[data-cat]');
  const filters = document.querySelectorAll('.filters a');
  if (posts.length && filters.length) {
    const apply = () => {
      const cat = (location.hash || '').slice(1);
      const valid = cat === 'montana' || cat === 'bici' ? cat : '';
      posts.forEach(p => { p.hidden = valid !== '' && p.dataset.cat !== valid; });
      filters.forEach(f => f.setAttribute('aria-current', String(f.getAttribute('href') === (valid ? '#' + valid : '#todas'))));
    };
    addEventListener('hashchange', apply);
    apply();
  }
})();
