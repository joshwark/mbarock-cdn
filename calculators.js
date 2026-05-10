/* MBA Rock — Interactive Financial Calculators
 * Loaded on-demand by lessons.js when a lesson has a calculator.
 * Styled in Harmonic Ledger: navy/gold/cream.
 */
(function () {
  'use strict';

  var CSS = [
    '.mr-calc{background:#071e3d;border:1px solid #D4AF37;border-radius:6px;padding:2rem;margin:2.5rem 0;font-family:"Instrument Sans",sans-serif;color:#FAFAF7;}',
    '.mr-calc-title{color:#D4AF37;font-size:0.68rem;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 0.25rem;font-weight:600;}',
    '.mr-calc-subtitle{color:rgba(250,250,247,0.5);font-size:0.78rem;margin:0 0 1.75rem;}',
    '.mr-calc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;}',
    '.mr-calc-field{display:flex;flex-direction:column;gap:0.35rem;}',
    '.mr-calc-field label{font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#D4AF37;font-weight:600;}',
    '.mr-calc-field input{background:#040f1e;border:1px solid rgba(212,175,55,0.25);border-radius:3px;padding:0.55rem 0.75rem;color:#FAFAF7;font-size:0.95rem;width:100%;box-sizing:border-box;transition:border-color 0.15s;}',
    '.mr-calc-field input:focus{outline:none;border-color:#D4AF37;}',
    '.mr-calc-rule{border:none;border-top:1px solid #D4AF37;margin:0 0 1.5rem;opacity:0.5;}',
    '.mr-calc-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1rem;}',
    '.mr-calc-result{background:#040f1e;border-radius:4px;padding:1rem;text-align:center;}',
    '.mr-calc-result-label{font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(250,250,247,0.5);margin-bottom:0.4rem;}',
    '.mr-calc-result-value{font-size:1.6rem;font-weight:700;color:#D4AF37;line-height:1;}',
    '.mr-calc-result-note{font-size:0.65rem;color:rgba(250,250,247,0.4);margin-top:0.3rem;}',
    '.mr-calc-result.highlight{border:1px solid rgba(212,175,55,0.4);}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('mr-calc-css')) return;
    var s = document.createElement('style');
    s.id = 'mr-calc-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function fmt(n, prefix, decimals) {
    if (!isFinite(n)) return '—';
    var d = decimals !== undefined ? decimals : 0;
    var abs = Math.abs(n);
    var str;
    if (abs >= 1e6) str = (n / 1e6).toFixed(2) + 'M';
    else if (abs >= 1e3) str = (n / 1e3).toFixed(1) + 'K';
    else str = n.toFixed(d);
    return (prefix || '') + str;
  }

  function fmtMonths(n) {
    if (!isFinite(n) || n <= 0) return '—';
    if (n >= 120) return '10+ yr';
    var mo = Math.floor(n);
    return mo + ' mo';
  }

  function fmtRatio(n) {
    if (!isFinite(n) || n <= 0) return '—';
    return n.toFixed(1) + 'x';
  }

  function fmtPct(n) {
    if (!isFinite(n)) return '—';
    return n.toFixed(1) + '%';
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
  }

  // ─── CALCULATOR DEFINITIONS ──────────────────────────────────────────────

  var CALCS = {};

  // 1. CASH FLOW (Oxygen)
  CALCS['m1l1-oxygen-cash-flow'] = {
    html: function (id) {
      return '<div class="mr-calc" id="' + id + '">' +
        '<p class="mr-calc-title">Cash Flow Calculator</p>' +
        '<p class="mr-calc-subtitle">See where your money actually goes each month.</p>' +
        '<div class="mr-calc-grid">' +
          field(id, 'rev', 'Monthly Revenue ($)', 50000) +
          field(id, 'cogs', 'Cost of Goods Sold ($)', 20000) +
          field(id, 'opex', 'Operating Expenses ($)', 15000) +
          field(id, 'other', 'Other Cash Out ($)', 0) +
        '</div>' +
        '<hr class="mr-calc-rule">' +
        '<div class="mr-calc-results">' +
          result(id, 'gp', 'Gross Profit', '', '') +
          result(id, 'gm', 'Gross Margin', '', '', '') +
          result(id, 'ncf', 'Net Cash Flow', '', '', 'highlight') +
          result(id, 'burn', 'Monthly Burn', '', '') +
        '</div></div>';
    },
    update: function (id) {
      var rev = val(id + '-rev'), cogs = val(id + '-cogs'),
          opex = val(id + '-opex'), other = val(id + '-other');
      var gp = rev - cogs;
      var ncf = gp - opex - other;
      var burn = cogs + opex + other;
      set(id + '-gp', fmt(gp, '$'));
      set(id + '-gm', fmtPct(rev > 0 ? (gp / rev * 100) : 0));
      set(id + '-ncf', fmt(ncf, '$'));
      set(id + '-burn', fmt(burn, '$'));
    }
  };

  // 2. GROSS MARGIN (Groove)
  CALCS['m1l3-gross-margin-groove'] = {
    html: function (id) {
      return '<div class="mr-calc" id="' + id + '">' +
        '<p class="mr-calc-title">Gross Margin Calculator</p>' +
        '<p class="mr-calc-subtitle">Know your margin before you scale anything.</p>' +
        '<div class="mr-calc-grid">' +
          field(id, 'price', 'Selling Price ($)', 100) +
          field(id, 'cogs', 'COGS per Unit ($)', 40) +
          field(id, 'units', 'Units Sold / Month', 500) +
          field(id, 'fixed', 'Fixed Costs / Month ($)', 10000) +
        '</div>' +
        '<hr class="mr-calc-rule">' +
        '<div class="mr-calc-results">' +
          result(id, 'gm', 'Gross Margin %', '', '', 'highlight') +
          result(id, 'contrib', 'Contribution / Unit', '', '') +
          result(id, 'rev', 'Monthly Revenue', '', '') +
          result(id, 'profit', 'Monthly Profit', '', '') +
        '</div></div>';
    },
    update: function (id) {
      var price = val(id + '-price'), cogs = val(id + '-cogs'),
          units = val(id + '-units'), fixed = val(id + '-fixed');
      var contrib = price - cogs;
      var rev = price * units;
      var grossProfit = contrib * units;
      var profit = grossProfit - fixed;
      var gm = price > 0 ? (contrib / price * 100) : 0;
      set(id + '-gm', fmtPct(gm));
      set(id + '-contrib', fmt(contrib, '$'));
      set(id + '-rev', fmt(rev, '$'));
      set(id + '-profit', fmt(profit, '$'));
    }
  };

  // 3. UNIT ECONOMICS / CAC + LTV (Burn Rate Blues)
  CALCS['m1l4-burn-rate-blues'] = {
    html: function (id) {
      return '<div class="mr-calc" id="' + id + '">' +
        '<p class="mr-calc-title">Unit Economics Calculator</p>' +
        '<p class="mr-calc-subtitle">CAC, LTV, and the ratio that determines your fate.</p>' +
        '<div class="mr-calc-grid">' +
          field(id, 'cac', 'CAC — Cost to Acquire Customer ($)', 200) +
          field(id, 'arpu', 'Monthly Revenue per Customer ($)', 50) +
          field(id, 'margin', 'Gross Margin (%)', 70) +
          field(id, 'churn', 'Monthly Churn Rate (%)', 5) +
        '</div>' +
        '<hr class="mr-calc-rule">' +
        '<div class="mr-calc-results">' +
          result(id, 'ltv', 'LTV', '', '', 'highlight') +
          result(id, 'ratio', 'LTV : CAC', '', '') +
          result(id, 'payback', 'Payback Period', '', '') +
          result(id, 'marg', 'Monthly Margin / Cust', '', '') +
        '</div></div>';
    },
    update: function (id) {
      var cac = val(id + '-cac'), arpu = val(id + '-arpu'),
          margin = val(id + '-margin'), churn = val(id + '-churn');
      var margPerCust = arpu * (margin / 100);
      var ltv = churn > 0 ? (margPerCust / (churn / 100)) : Infinity;
      var ratio = cac > 0 ? (ltv / cac) : 0;
      var payback = margPerCust > 0 ? (cac / margPerCust) : Infinity;
      set(id + '-ltv', fmt(ltv, '$'));
      set(id + '-ratio', fmtRatio(ratio));
      set(id + '-payback', fmtMonths(payback));
      set(id + '-marg', fmt(margPerCust, '$', 2));
    }
  };

  // 4. BREAK-EVEN (Cash Runway / Breakeven Proof)
  CALCS['16-cash-runway'] = {
    html: function (id) {
      return '<div class="mr-calc" id="' + id + '">' +
        '<p class="mr-calc-title">Break-Even Calculator</p>' +
        '<p class="mr-calc-subtitle">How many units until you stop losing money.</p>' +
        '<div class="mr-calc-grid">' +
          field(id, 'fixed', 'Fixed Costs / Month ($)', 20000) +
          field(id, 'price', 'Price per Unit ($)', 100) +
          field(id, 'vc', 'Variable Cost per Unit ($)', 40) +
          field(id, 'units', 'Units Sold / Month (optional)', 0) +
        '</div>' +
        '<hr class="mr-calc-rule">' +
        '<div class="mr-calc-results">' +
          result(id, 'be', 'Break-Even Units', '', '', 'highlight') +
          result(id, 'berev', 'Break-Even Revenue', '', '') +
          result(id, 'margin', 'Contribution Margin', '', '') +
          result(id, 'profit', 'Current Profit / Loss', '', '') +
        '</div></div>';
    },
    update: function (id) {
      var fixed = val(id + '-fixed'), price = val(id + '-price'),
          vc = val(id + '-vc'), units = val(id + '-units');
      var contrib = price - vc;
      var be = contrib > 0 ? Math.ceil(fixed / contrib) : Infinity;
      var beRev = be * price;
      var cm = price > 0 ? (contrib / price * 100) : 0;
      var profit = (contrib * units) - fixed;
      set(id + '-be', isFinite(be) ? be.toLocaleString() : '—');
      set(id + '-berev', fmt(beRev, '$'));
      set(id + '-margin', fmtPct(cm));
      set(id + '-profit', units > 0 ? fmt(profit, '$') : '—');
    }
  };

  // 5. CASH RUNWAY (Cash Timing)
  CALCS['17-april-cash-timing'] = {
    html: function (id) {
      return '<div class="mr-calc" id="' + id + '">' +
        '<p class="mr-calc-title">Cash Runway Calculator</p>' +
        '<p class="mr-calc-subtitle">Your most important number. Know it at all times.</p>' +
        '<div class="mr-calc-grid">' +
          field(id, 'cash', 'Current Cash Balance ($)', 500000) +
          field(id, 'rev', 'Monthly Revenue ($)', 50000) +
          field(id, 'opex', 'Monthly Operating Expenses ($)', 80000) +
          field(id, 'growth', 'Monthly Revenue Growth (%)', 0) +
        '</div>' +
        '<hr class="mr-calc-rule">' +
        '<div class="mr-calc-results">' +
          result(id, 'burn', 'Net Burn / Month', '', '', 'highlight') +
          result(id, 'runway', 'Runway', '', '') +
          result(id, 'default', 'Default Alive?', '', '') +
          result(id, 'ramen', 'Months to Ramen Profitable', '', '') +
        '</div></div>';
    },
    update: function (id) {
      var cash = val(id + '-cash'), rev = val(id + '-rev'),
          opex = val(id + '-opex'), growth = val(id + '-growth');
      var burn = opex - rev;
      // simple runway: simulate month by month up to 120
      var runway = 0, r = rev, c = cash;
      if (burn <= 0) {
        runway = Infinity;
      } else {
        for (var i = 0; i < 120; i++) {
          c -= (opex - r);
          r *= (1 + growth / 100);
          if (c <= 0) { runway = i + 1; break; }
          if (i === 119) runway = Infinity;
        }
      }
      // default alive: when does revenue = opex with growth?
      var defaultAlive = '—';
      if (growth > 0) {
        var r2 = rev;
        for (var j = 0; j < 120; j++) {
          r2 *= (1 + growth / 100);
          if (r2 >= opex) { defaultAlive = 'Yes — ' + (j + 1) + ' mo'; break; }
        }
        if (defaultAlive === '—') defaultAlive = 'No';
      } else {
        defaultAlive = rev >= opex ? 'Yes' : 'No';
      }
      // months to ramen breakeven (revenue = opex)
      var ramen;
      if (rev >= opex) ramen = 'Now';
      else if (growth <= 0) ramen = '—';
      else {
        var r3 = rev;
        for (var k = 1; k <= 120; k++) {
          r3 *= (1 + growth / 100);
          if (r3 >= opex) { ramen = k + ' mo'; break; }
          if (k === 120) ramen = '120+ mo';
        }
      }
      set(id + '-burn', fmt(Math.max(0, burn), '$') + (burn <= 0 ? ' ✓' : ''));
      set(id + '-runway', runway === Infinity ? '∞' : fmtMonths(runway));
      set(id + '-default', defaultAlive);
      set(id + '-ramen', ramen || '—');
    }
  };

  // 6. OPERATING LEVERAGE
  CALCS['19-operating-leverage'] = {
    html: function (id) {
      return '<div class="mr-calc" id="' + id + '">' +
        '<p class="mr-calc-title">Operating Leverage Calculator</p>' +
        '<p class="mr-calc-subtitle">High fixed costs amplify gains — and losses.</p>' +
        '<div class="mr-calc-grid">' +
          field(id, 'rev', 'Revenue ($)', 100000) +
          field(id, 'vc', 'Variable Costs ($)', 30000) +
          field(id, 'fixed', 'Fixed Costs ($)', 50000) +
          field(id, 'revdelta', 'Revenue Change (%)', 10) +
        '</div>' +
        '<hr class="mr-calc-rule">' +
        '<div class="mr-calc-results">' +
          result(id, 'dol', 'Degree of Op. Leverage', '', '', 'highlight') +
          result(id, 'opinc', 'Operating Income', '', '') +
          result(id, 'newopinc', 'New Op. Income', '', '') +
          result(id, 'opincdelta', 'Profit Change', '', '') +
        '</div></div>';
    },
    update: function (id) {
      var rev = val(id + '-rev'), vc = val(id + '-vc'),
          fixed = val(id + '-fixed'), delta = val(id + '-revdelta');
      var contrib = rev - vc;
      var opInc = contrib - fixed;
      var dol = opInc !== 0 ? (contrib / opInc) : Infinity;
      var newRev = rev * (1 + delta / 100);
      var newOpInc = (newRev - vc * (newRev / rev)) - fixed;
      var pctChange = opInc !== 0 ? ((newOpInc - opInc) / Math.abs(opInc) * 100) : 0;
      set(id + '-dol', isFinite(dol) ? dol.toFixed(2) + 'x' : '∞');
      set(id + '-opinc', fmt(opInc, '$'));
      set(id + '-newopinc', fmt(newOpInc, '$'));
      set(id + '-opincdelta', fmtPct(pctChange));
    }
  };

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  function field(id, key, label, dflt) {
    return '<div class="mr-calc-field">' +
      '<label for="' + id + '-' + key + '">' + label + '</label>' +
      '<input type="number" id="' + id + '-' + key + '" value="' + dflt + '" step="any">' +
      '</div>';
  }

  function result(id, key, label, prefix, suffix, cls) {
    return '<div class="mr-calc-result' + (cls ? ' ' + cls : '') + '">' +
      '<div class="mr-calc-result-label">' + label + '</div>' +
      '<div class="mr-calc-result-value" id="' + id + '-' + key + '">—</div>' +
      '</div>';
  }

  function set(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────

  window.MBARockCalc = {
    SLUGS: Object.keys(CALCS),
    has: function (slug) { return !!CALCS[slug]; },
    render: function (slug, container) {
      if (!CALCS[slug]) return;
      injectStyle();
      var id = 'mr-calc-' + slug;
      container.innerHTML = CALCS[slug].html(id);
      // initial calculation
      CALCS[slug].update(id);
      // wire up inputs
      container.querySelectorAll('input').forEach(function (inp) {
        inp.addEventListener('input', function () { CALCS[slug].update(id); });
      });
    }
  };

})();
