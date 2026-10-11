/* ELARA mobile-money payment gateway popup (bKash / Nagad). Built from the Figma "bKash gateway popup" frames.
   This is a front-end simulation: there is no backend, so any valid mobile number, 6-digit code and 5-digit PIN succeeds.

   ElaraGateway.open({ brand: 'bkash' | 'nagad', amount: 2960, invoice: 'ELR-315159',
                       onSuccess(trxId), onClose() })

   Test hooks (so every state in the Figma file can be reached):
     verification code 000000  -> "Incorrect verification code" (3 tries, then the session expires)
     PIN 00000 (bKash) / 0000 (Nagad) -> "Insufficient balance"
     a window left open for 5 minutes -> "Session expired"
*/
(function () {
  var BRANDS = {
    bkash: { name: 'bKash', c: '#E2136E', g1: '#E8266F', g2: '#C9105A', logo: 'assets/checkout/pay-bkash.webp', lw: 113, lh: 64, lx: -3.75, ly: -5, help: '16247', pinLen: 5 },
    nagad: { name: 'Nagad', c: '#E8541F', g1: '#F26C28', g2: '#D63A16', logo: 'assets/checkout/pay-nagad.webp', lw: 80, lh: 50, lx: 0, ly: 0, help: '16167', pinLen: 4, layout: 'nagad' }
  };
  var CSS = [
    '.gw-root{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:70px 16px 24px;overflow:auto;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}',
    '.gw-scrim{position:fixed;inset:0;background:rgba(28,27,26,.6);animation:gwFade .2s ease-out}',
    '.gw-pop{position:relative;width:400px;max-width:100%;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.28);animation:gwUp .26s cubic-bezier(.22,.8,.3,1);color:#2b2b2b}',
    '.gw-head{display:flex;justify-content:center;padding:20px 24px 16px;background:#fff}',
    '.gw-logo{display:flex;align-items:center;gap:6px;padding:2px 18px 2px 10px;border:1.5px solid var(--gw-c);border-radius:4px}',
    '.gw-mark{position:relative;display:block;width:80px;height:50px;border-radius:10px;overflow:hidden;background:#fff;flex:none}',
    '.gw-mark img{position:absolute;max-width:none;display:block}',
    '.gw-pay{font-size:26px;line-height:1.2;color:var(--gw-c)}',
    '.gw-line{height:5px;background:var(--gw-c)}',
    '.gw-merch{display:flex;align-items:center;gap:12px;padding:14px 20px;background:#fff}',
    '.gw-av{width:40px;height:40px;flex:none;border:1px solid #ddd5c6;border-radius:50%;background:#fffdf9;display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-size:18px;color:#4a4741}',
    '.gw-mt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}',
    '.gw-mt b{font-size:14px;font-weight:500;color:#2b2b2b}.gw-mt i{font-style:normal;font-size:12px;color:#838280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.gw-amt{font-size:20px;color:#2b2b2b;white-space:nowrap}',
    '.gw-body{position:relative;min-height:230px;padding:26px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(145deg,var(--gw-g1),var(--gw-g2));color:#fff;text-align:center}',
    '.gw-body.gw-white{background:#fff;color:#2b2b2b}',
    '.gw-lbl{font-size:14px;font-weight:500;line-height:1.4;width:100%}',
    '.gw-note{font-size:12px;line-height:17px;width:100%}',
    '.gw-note a,.gw-note button{color:inherit;text-decoration:underline;font:inherit;background:none;border:0;padding:0;cursor:pointer}',
    '.gw-note.gw-muted{color:#6b6b6b}',
    '.gw-field{width:100%;height:46px;border:0;border-radius:2px;background:#fff;color:#2b2b2b;font:400 15px Inter,sans-serif;text-align:center;outline:0}',
    '.gw-field::placeholder{color:#9aa0a6}',
    '.gw-field:focus{box-shadow:0 0 0 2px #3184ff}',
    '.gw-boxes{position:relative;display:flex;gap:8px;justify-content:center}',
    '.gw-box{width:42px;height:50px;border-radius:2px;background:#fff;color:#2b2b2b;font-size:20px;font-weight:500;display:flex;align-items:center;justify-content:center}',
    '.gw-box.on{box-shadow:inset 0 0 0 2px #3184ff}',
    '.gw-box.bad{box-shadow:inset 0 0 0 2px #ff4d4d}',
    '.gw-boxes input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;padding:0;font-size:16px;cursor:text}',
    '.gw-msg{width:100%;padding:10px 12px;border-radius:4px;background:rgba(0,0,0,.22);font-size:13px;font-weight:500;line-height:18px;text-align:left}',
    '.gw-badge{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;line-height:1}',
    '.gw-title{font-size:20px;font-weight:700;line-height:1.3}',
    '.gw-title.sm{font-size:18px}',
    '.gw-spin{width:52px;height:52px;border-radius:50%;border:4.6px solid rgba(255,255,255,.25);border-top-color:#fff;animation:gwSpin .9s linear infinite}',
    '.gw-btns{display:flex;gap:1px;background:#fff}',
    '.gw-b{flex:1;height:50px;border:0;background:#cbced2;color:#fff;font:700 13px Inter,sans-serif;letter-spacing:.4px;cursor:pointer;transition:background-color .15s}',
    '.gw-b:disabled{cursor:default}',
    '.gw-b.go:not(:disabled){background:var(--gw-c)}',
    '.gw-b.go:not(:disabled):hover{filter:brightness(.92)}',
    '.gw-help{display:flex;justify-content:center;align-items:center;gap:8px;padding:14px 0;background:#fff}',
    '.gw-help span{font-size:12px;color:#838280}.gw-help b{font-size:18px;font-weight:700;color:var(--gw-c)}',
    '.gw-b:focus-visible,.gw-note button:focus-visible{outline:2px solid #3184ff;outline-offset:-3px}',
    '.gw-nagad .gw-pop{border-radius:20px}',
    '.gw-nagad .gw-head{flex-direction:column;align-items:center;gap:12px;padding:26px 24px 22px;background:linear-gradient(180deg,#F7941D,#EE1C25);color:#fff}',
    '.gw-tile{width:112px;height:112px;border-radius:26px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}',
    '.gw-tile img{width:102px;height:64px;object-fit:cover;display:block}',
    '.gw-pay2{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.gw-pay2 span{font-size:14px;font-weight:500}.gw-pay2 b{font-size:30px;font-weight:700;line-height:1.2}.gw-pay2 i{font-style:normal;font-size:12px}',
    '.gw-nagad .gw-body{background:#fff;color:#4a4741;min-height:210px;padding:26px 24px 22px;gap:16px}',
    '.gw-nagad .gw-lbl{font-size:15px;line-height:21px}',
    '.gw-nagad .gw-note{color:#838280;line-height:18px}',
    '.gw-nagad .gw-field{height:52px;border:1.5px solid #ddd5c6;border-radius:12px;font-size:16px;color:#4a4741}',
    '.gw-nagad .gw-field:focus{border-color:#EE1C25;box-shadow:none}',
    '.gw-nagad .gw-boxes{gap:10px}',
    '.gw-nagad .gw-box{width:44px;height:54px;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 1.5px #ddd5c6;font-weight:700;color:#4a4741}',
    '.gw-nagad .gw-box.pin{width:54px}',
    '.gw-nagad .gw-box.on{box-shadow:inset 0 0 0 2px #EE1C25}',
    '.gw-nagad .gw-box.bad{background:#FDF1EF;box-shadow:inset 0 0 0 2px #D22C15}',
    '.gw-nagad .gw-msg{background:#FDF1EF;color:#B3261E;border:1px solid rgba(210,44,21,.4);border-radius:10px;padding:10px 14px}',
    '.gw-nagad .gw-title{color:#4a4741}',
    '.gw-nagad .gw-spin{border-color:#ddd5c6;border-top-color:#EE1C25}',
    '.gw-nagad .gw-btns{gap:12px;padding:0 24px 18px;background:#fff}',
    '.gw-nagad .gw-b{height:50px;border-radius:999px;font:600 14px Inter,sans-serif;letter-spacing:0;background:#EFEBE4;color:#A8A5A0}',
    '.gw-nagad .gw-b#gwL{background:transparent;color:#4a4741;border:1px solid #4a4741}',
    '.gw-nagad .gw-b.go:not(:disabled){background:linear-gradient(90deg,#F7941D,#EE1C25);color:#fff}',
    '.gw-nagad .gw-help{background:#FAF7F2;padding:12px 0 16px}',
    '.gw-nagad .gw-help b{font-size:16px;color:#EE1C25}',
    '@keyframes gwFade{from{opacity:0}to{opacity:1}}@keyframes gwUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@keyframes gwSpin{to{transform:rotate(360deg)}}',
    '@media(max-width:480px){.gw-root{padding:36px 24px 24px}.gw-nagad .gw-box{width:40px}.gw-head{padding:18px 20px 14px}.gw-merch{padding:12px 16px}.gw-amt{font-size:18px}.gw-body{padding:24px 20px}.gw-box{width:38px}.gw-pay{font-size:24px}}',
    '@media(prefers-reduced-motion:reduce){.gw-pop,.gw-scrim,.gw-spin{animation:none}}'
  ].join('');

  var root = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return 'Tk. ' + Number(n).toLocaleString('en-US'); }
  function fmtPhone(p) { return p.replace(/^(\d{5})(\d{3})(\d{3})$/, '$1 $2 $3'); }
  function trxId() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', s = ''; for (var i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }

  function open(o) {
    if (root) return;
    var B = BRANDS[o.brand] || BRANDS.bkash;
    if (!document.getElementById('gwStyle')) { var st = document.createElement('style'); st.id = 'gwStyle'; st.textContent = CSS; document.head.appendChild(st); }
    var S = { step: 'num', phone: '', code: '', pin: '', tries: 3, left: 120, bad: false, done: false };
    var prevFocus = document.activeElement, timers = {}, finished = false;

    root = document.createElement('div');
    root.className = 'gw-root' + (B.layout ? ' gw-' + B.layout : '');
    root.style.setProperty('--gw-c', B.c); root.style.setProperty('--gw-g1', B.g1); root.style.setProperty('--gw-g2', B.g2);
    root.innerHTML =
      '<div class="gw-scrim"></div>' +
      '<div class="gw-pop" role="dialog" aria-modal="true" aria-label="' + B.name + ' payment">' +
        (B.layout === 'nagad'
          ? '<div class="gw-head"><span class="gw-tile"><img src="' + B.logo + '" alt="' + B.name + '"></span><div class="gw-pay2"><span>Pay to ELARA</span><b>' + money(o.amount) + '</b><i>Invoice: ' + esc(o.invoice || '') + '</i></div></div>'
          : '<div class="gw-head"><div class="gw-logo"><span class="gw-mark"><img src="' + B.logo + '" alt="' + B.name + '" style="width:' + B.lw + 'px;height:' + B.lh + 'px;left:' + B.lx + 'px;top:' + B.ly + 'px"></span><span class="gw-pay">Payment</span></div></div>' +
            '<div class="gw-line"></div>' +
            '<div class="gw-merch"><span class="gw-av" aria-hidden="true">E</span><span class="gw-mt"><b>ELARA</b><i>Invoice: ' + esc(o.invoice || '') + '</i></span><span class="gw-amt">' + money(o.amount) + '</span></div>') +
        '<div class="gw-body" id="gwBody" aria-live="polite"></div>' +
        '<div class="gw-btns"><button type="button" class="gw-b" id="gwL">CLOSE</button><button type="button" class="gw-b go" id="gwR">CONFIRM</button></div>' +
        '<div class="gw-help"><span>Helpline</span><b>' + B.help + '</b></div>' +
      '</div>';
    document.body.appendChild(root);
    var prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';

    var body = root.querySelector('#gwBody'), L = root.querySelector('#gwL'), R = root.querySelector('#gwR');

    function boxes(val, n, mask, bad) {
      var cls = mask ? ' pin' : '';
      var h = '<div class="gw-boxes">';
      for (var i = 0; i < n; i++) {
        var c = val[i] ? (mask ? '•' : val[i]) : '';
        h += '<span class="gw-box' + cls + (bad ? ' bad' : (i === val.length && i < n ? ' on' : '')) + '">' + c + '</span>';
      }
      return h + '<input id="gwIn" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" maxlength="' + n + '" aria-label="' + (mask ? 'PIN' : 'Verification code') + '"></div>';
    }
    function mmss(s) { return '0' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function otpNote() {
      return (S.left > 0 ? 'Code expires in ' + mmss(S.left) : 'Code expired') + ' · <button type="button" id="gwResend">Resend code</button>';
    }

    function paint() {
      var h = '', right = 'CONFIRM', left = 'CLOSE', on = false, white = false;
      if (S.step === 'num') {
        h = '<div class="gw-lbl">Your ' + B.name + ' Account number</div>' +
            '<input class="gw-field" id="gwIn" type="tel" inputmode="numeric" maxlength="11" placeholder="e.g 01XXXXXXXXX" autocomplete="tel-national" value="' + esc(S.phone) + '" aria-label="' + B.name + ' account number">' +
            '<div class="gw-note">By clicking on Confirm, you are agreeing to the <u>terms &amp; conditions</u></div>';
        on = /^01[3-9]\d{8}$/.test(S.phone);
      } else if (S.step === 'otp') {
        h = '<div class="gw-lbl">Enter the verification code sent to ' + fmtPhone(S.phone) + '</div>' + boxes(S.bad ? S.shown : S.code, 6, false, S.bad) +
            (S.bad ? '<div class="gw-msg" role="alert">Incorrect verification code. You have ' + S.tries + ' attempt' + (S.tries === 1 ? '' : 's') + ' left.</div>' : '') +
            '<div class="gw-note" id="gwNote">' + otpNote() + '</div>';
        on = S.code.length === 6;
      } else if (S.step === 'pin') {
        h = '<div class="gw-lbl">Enter your ' + B.name + ' PIN</div>' + boxes(S.pin, B.pinLen, true, false) +
            '<div class="gw-note">' + (B.layout === 'nagad' ? 'Nagad will never ask for your PIN or code over the phone. Do not share it.' : B.name + ' will never ask for your PIN outside this window. Do not share it.') + '</div>';
        on = S.pin.length === B.pinLen;
      } else if (S.step === 'proc') {
        h = '<div class="gw-spin" aria-hidden="true"></div><div class="gw-lbl">Processing your payment</div><div class="gw-note">Please do not close or refresh this window.</div>';
      } else if (S.step === 'ok') {
        white = true; left = null; right = 'RETURN TO ELARA'; on = true;
        h = '<div class="gw-badge" style="background:#0ca817;color:#fff" aria-hidden="true">✓</div><div class="gw-title">Payment successful</div>' +
            '<div class="gw-note gw-muted">' + money(o.amount) + ' paid to ELARA · Transaction ID ' + S.trx + '</div>' +
            '<div class="gw-note gw-muted" id="gwRet">Returning to ELARA in ' + S.ret + ' seconds…</div>';
      } else if (S.step === 'bal') {
        right = 'TRY AGAIN'; on = true;
        h = '<div class="gw-badge" style="' + (B.layout === 'nagad' ? 'background:#D22C15;color:#fff' : 'background:#fff;color:var(--gw-c)') + '" aria-hidden="true">!</div><div class="gw-title sm">Insufficient balance</div>' +
            '<div class="gw-note">Your ' + B.name + ' balance is lower than ' + money(o.amount) + '. Add money to your account and try again.</div>';
      } else if (S.step === 'exp') {
        right = 'TRY AGAIN'; on = true;
        h = '<div class="gw-badge" style="' + (B.layout === 'nagad' ? 'background:#C77D0A;color:#fff' : 'background:#fff;color:var(--gw-c)') + '" aria-hidden="true">!</div><div class="gw-title sm">Session expired</div>' +
            '<div class="gw-note">This payment window timed out. Your order is saved, so you can start again within 15 minutes.</div>';
      }
      body.className = 'gw-body' + (white ? ' gw-white' : '');
      body.innerHTML = h;
      L.hidden = !left; if (left) L.textContent = left;
      R.textContent = right; R.disabled = !on;
      L.disabled = S.step === 'proc';
      var inp = body.querySelector('#gwIn');
      if (inp) {
        if (S.step === 'num') {
          inp.addEventListener('input', function () { S.phone = inp.value.replace(/\D/g, '').slice(0, 11); inp.value = S.phone; R.disabled = !/^01[3-9]\d{8}$/.test(S.phone); });
        } else {
          var key = S.step === 'otp' ? 'code' : 'pin', n = S.step === 'otp' ? 6 : B.pinLen;
          inp.value = S[key];
          inp.addEventListener('input', function () {
            S[key] = inp.value.replace(/\D/g, '').slice(0, n); inp.value = S[key];
            if (S.bad) { S.bad = false; paint(); return; }
            var bx = body.querySelectorAll('.gw-box');
            for (var i = 0; i < n; i++) { bx[i].textContent = S[key][i] ? (key === 'pin' ? '•' : S[key][i]) : ''; bx[i].classList.toggle('on', i === S[key].length); }
            R.disabled = S[key].length !== n;
          });
        }
        if (!/Android|iPhone/.test(navigator.userAgent) || S.step !== 'num') inp.focus({ preventScroll: true });
        if (S.step === 'num') { var v = inp.value; inp.value = ''; inp.value = v; }
      }
      var rs = body.querySelector('#gwResend');
      if (rs) rs.addEventListener('click', function () { S.left = 120; S.code = ''; S.bad = false; paint(); });
      else if (!body.querySelector('#gwIn') && !L.hidden) L.focus();
      if (S.step === 'ok') R.focus();
    }

    function stopTimers() { clearInterval(timers.tick); clearTimeout(timers.proc); clearInterval(timers.ret); }
    function go(step) { S.step = step; paint(); }

    function confirm() {
      if (R.disabled) return;
      if (S.step === 'num') { S.code = ''; S.left = 120; S.bad = false; S.tries = 3; go('otp'); }
      else if (S.step === 'otp') {
        if (S.code === '000000') {
          S.tries--; S.bad = true; S.shown = S.code; S.code = '';
          if (S.tries <= 0) { go('exp'); return; }
          paint(); S.bad = true;
        } else { S.pin = ''; go('pin'); }
      } else if (S.step === 'pin') {
        go('proc');
        timers.proc = setTimeout(function () {
          if (/^0+$/.test(S.pin)) { go('bal'); return; }
          S.trx = trxId(); S.ret = 5; go('ok');
          timers.ret = setInterval(function () {
            S.ret--;
            if (S.ret <= 0) { clearInterval(timers.ret); finish(true); return; }
            var r = root && root.querySelector('#gwRet'); if (r) r.textContent = 'Returning to ELARA in ' + S.ret + ' seconds…';
          }, 1000);
        }, 1800);
      } else if (S.step === 'ok') { finish(true); }
      else if (S.step === 'bal' || S.step === 'exp') { S.pin = ''; S.code = ''; S.bad = false; go('num'); startSession(); }
    }

    function startSession() {
      clearTimeout(timers.sess);
      timers.sess = setTimeout(function () { if (S.step !== 'ok' && S.step !== 'proc') go('exp'); }, 5 * 60000);
    }

    function finish(ok) {
      if (finished) return; finished = true;
      stopTimers(); clearTimeout(timers.sess);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      if (root) { root.remove(); root = null; }
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus({ preventScroll: true }); } catch (e) {} }
      if (ok && o.onSuccess) o.onSuccess(S.trx);
      else if (!ok && o.onClose) o.onClose();
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); if (S.step !== 'proc') finish(S.step === 'ok'); }
      else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); confirm(); }
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(root.querySelectorAll('button:not([disabled]):not([hidden]),input'), function (x) { return x.offsetParent !== null || x.type === 'tel' || x.type === ''; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);

    L.addEventListener('click', function () { finish(false); });
    R.addEventListener('click', confirm);
    S.tickStarted = true;
    timers.tick = setInterval(function () {
      if (S.step !== 'otp') return;
      if (S.left > 0) S.left--;
      var n = root && root.querySelector('#gwNote');
      if (n) { n.innerHTML = otpNote(); var rs = n.querySelector('#gwResend'); if (rs) rs.addEventListener('click', function () { S.left = 120; S.code = ''; S.bad = false; paint(); }); }
    }, 1000);
    startSession();
    paint();
  }

  window.ElaraGateway = { open: open, isOpen: function () { return !!root; } };
})();
