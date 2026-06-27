const els = {
  creditLimit: document.getElementById('creditLimit'),
  currency: document.getElementById('currency'),
  cutDay: document.getElementById('cutDay'),
  payDay: document.getElementById('payDay'),
  currentBalance: document.getElementById('currentBalance'),
  usagePercent: document.getElementById('usagePercent'),
  nextCut: document.getElementById('nextCut'),
  nextPay: document.getElementById('nextPay'),
  statusBadge: document.getElementById('statusBadge'),
  progressBar: document.getElementById('progressBar'),
  payTo10: document.getElementById('payTo10'),
  payTo30: document.getElementById('payTo30'),
  roomTo10: document.getElementById('roomTo10'),
  roomTo30: document.getElementById('roomTo30'),
  smartAdvice: document.getElementById('smartAdvice'),
  movementForm: document.getElementById('movementForm'),
  date: document.getElementById('date'),
  type: document.getElementById('type'),
  description: document.getElementById('description'),
  amount: document.getElementById('amount'),
  movementList: document.getElementById('movementList'),
  emptyState: document.getElementById('emptyState'),
  clearBtn: document.getElementById('clearBtn'),
  themeBtn: document.getElementById('themeBtn')
};

let state = JSON.parse(localStorage.getItem('creditManagerState')) || {
  settings: { creditLimit: 10000, currency: 'PLN', cutDay: 12, payDay: 30 },
  movements: [],
  dark: false
};

function save() {
  localStorage.setItem('creditManagerState', JSON.stringify(state));
}

function money(value) {
  return `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${state.settings.currency}`;
}

function formatDate(date) {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function nextDateByDay(day) {
  const today = new Date();
  const result = new Date(today.getFullYear(), today.getMonth(), day);
  if (result < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

function daysUntil(date) {
  const today = new Date();
  const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((cleanDate - cleanToday) / (1000 * 60 * 60 * 24));
}

function getBalance() {
  return state.movements.reduce((total, item) => {
    return item.type === 'charge' ? total + item.amount : total - item.amount;
  }, 0);
}

function renderSettings() {
  els.creditLimit.value = state.settings.creditLimit;
  els.currency.value = state.settings.currency;
  els.cutDay.value = state.settings.cutDay;
  els.payDay.value = state.settings.payDay;
  document.body.classList.toggle('dark', state.dark);
  els.themeBtn.textContent = state.dark ? '☀' : '☾';
}

function renderDashboard() {
  const balance = Math.max(getBalance(), 0);
  const limit = Number(state.settings.creditLimit) || 1;
  const usage = (balance / limit) * 100;
  const cutDate = nextDateByDay(Number(state.settings.cutDay));
  const payDate = nextDateByDay(Number(state.settings.payDay));
  const target10 = limit * 0.10;
  const target30 = limit * 0.30;
  const pay10 = Math.max(balance - target10, 0);
  const pay30 = Math.max(balance - target30, 0);
  const room10 = Math.max(target10 - balance, 0);
  const room30 = Math.max(target30 - balance, 0);

  els.currentBalance.textContent = money(balance);
  els.usagePercent.textContent = `${usage.toFixed(1)}%`;
  els.nextCut.textContent = `${formatDate(cutDate)} · ${daysUntil(cutDate)} días`;
  els.nextPay.textContent = `${formatDate(payDate)} · ${daysUntil(payDate)} días`;
  els.payTo10.textContent = money(pay10);
  els.payTo30.textContent = money(pay30);
  els.roomTo10.textContent = pay10 === 0
    ? `Ya estás por debajo del 10%. Margen disponible: ${money(room10)}.`
    : `Necesitas pagar ${money(pay10)} para bajar al 10%.`;
  els.roomTo30.textContent = pay30 === 0
    ? `Ya estás por debajo del 30%. Margen disponible: ${money(room30)}.`
    : `Necesitas pagar ${money(pay30)} para bajar al 30%.`;

  const barWidth = Math.min(usage, 100);
  els.progressBar.style.width = `${barWidth}%`;

  els.statusBadge.className = 'badge';
  if (usage <= 10) {
    els.statusBadge.classList.add('green');
    els.statusBadge.textContent = 'Excelente';
    els.progressBar.style.background = 'var(--green)';
    els.smartAdvice.textContent = `Vas muy bien. Estás en ${usage.toFixed(1)}%, por debajo del 10%. No necesitas pagar antes del corte, salvo que quieras dejar el saldo en cero.`;
  } else if (usage <= 30) {
    els.statusBadge.classList.add('yellow');
    els.statusBadge.textContent = 'Aceptable';
    els.progressBar.style.background = 'var(--yellow)';
    els.smartAdvice.textContent = `Estás dentro de un rango aceptable. Para optimizar mejor, paga ${money(pay10)} antes del corte.`;
  } else {
    els.statusBadge.classList.add('red');
    els.statusBadge.textContent = 'Alto';
    els.progressBar.style.background = 'var(--red)';
    els.smartAdvice.textContent = `Tu utilización está alta. Paga al menos ${money(pay30)} para bajar a 30%, o ${money(pay10)} para quedar cerca del 10%.`;
  }
}

function renderMovements() {
  els.movementList.innerHTML = '';
  els.emptyState.style.display = state.movements.length ? 'none' : 'block';

  const sorted = [...state.movements].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach(item => {
    const row = document.createElement('div');
    row.className = 'movement';
    row.innerHTML = `
      <div>
        <p>${item.description}</p>
        <small>${item.date} · ${item.type === 'charge' ? 'Compra' : 'Pago'}</small>
      </div>
      <div>
        <span class="amount ${item.type}">${item.type === 'charge' ? '+' : '-'} ${money(item.amount)}</span>
        <button class="delete-btn" data-id="${item.id}" title="Eliminar">×</button>
      </div>
    `;
    els.movementList.appendChild(row);
  });
}

function render() {
  renderSettings();
  renderDashboard();
  renderMovements();
}

function updateSetting(key, value) {
  state.settings[key] = value;
  save();
  render();
}

els.creditLimit.addEventListener('input', e => updateSetting('creditLimit', Number(e.target.value)));
els.currency.addEventListener('input', e => updateSetting('currency', e.target.value.toUpperCase() || 'PLN'));
els.cutDay.addEventListener('input', e => updateSetting('cutDay', Number(e.target.value)));
els.payDay.addEventListener('input', e => updateSetting('payDay', Number(e.target.value)));

els.movementForm.addEventListener('submit', e => {
  e.preventDefault();
  state.movements.push({
    id: crypto.randomUUID(),
    date: els.date.value,
    type: els.type.value,
    description: els.description.value.trim(),
    amount: Number(els.amount.value)
  });
  els.movementForm.reset();
  els.date.valueAsDate = new Date();
  save();
  render();
});

els.movementList.addEventListener('click', e => {
  if (!e.target.matches('.delete-btn')) return;
  state.movements = state.movements.filter(item => item.id !== e.target.dataset.id);
  save();
  render();
});

els.clearBtn.addEventListener('click', () => {
  if (!confirm('¿Seguro que quieres borrar todos los movimientos?')) return;
  state.movements = [];
  save();
  render();
});

els.themeBtn.addEventListener('click', () => {
  state.dark = !state.dark;
  save();
  render();
});

els.date.valueAsDate = new Date();
render();
