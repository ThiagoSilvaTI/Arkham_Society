(() => {
    const emptyWorkspace = { customers: [], transactions: [] };
    const authScreen = document.getElementById('authScreen');
    const appShell = document.getElementById('appShell');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalForm = document.getElementById('recordForm');
    let registering = false;
    let user = null;
    let workspace = emptyWorkspace;
    let modalType = null;

    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);

    const currency = value => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);

    const localDate = date => new Intl.DateTimeFormat('pt-BR').format(date);
    const parseDate = value => new Date(`${value}T12:00:00`);
    const initials = value => String(value || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

    async function request(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a solicitação.');
        return result;
    }

    function setAuthError(message = '') {
        authError.textContent = message;
    }

    function setAuthMode(nextMode) {
        registering = nextMode;
        authScreen.classList.toggle('registering', registering);
        document.getElementById('authEyebrow').textContent = registering ? 'COMECE POR AQUI' : 'BEM-VINDO DE VOLTA';
        document.getElementById('authTitle').textContent = registering ? 'Crie o espaço da sua empresa' : 'Acesse sua conta';
        document.getElementById('authDescription').textContent = registering
            ? 'Uma conta protegida para organizar o seu negócio.'
            : 'Entre para acompanhar a sua empresa.';
        document.getElementById('authSubmit').innerHTML = registering
            ? 'Criar espaço de trabalho <span aria-hidden="true">→</span>'
            : 'Entrar na plataforma <span aria-hidden="true">→</span>';
        document.getElementById('authSwitchText').textContent = registering ? 'Já tem uma conta?' : 'Ainda não tem uma conta?';
        document.getElementById('authSwitch').textContent = registering ? 'Entrar' : 'Criar empresa';
        authForm.elements.company.required = registering;
        authForm.elements.name.required = registering;
        authForm.elements.password.autocomplete = registering ? 'new-password' : 'current-password';
        setAuthError();
    }

    function showAuth(message = '') {
        user = null;
        workspace = emptyWorkspace;
        appShell.hidden = true;
        authScreen.hidden = false;
        authForm.reset();
        setAuthMode(false);
        setAuthError(message);
    }

    async function showWorkspace(account) {
        const result = await request('/api/workspace');
        user = account;
        workspace = result.state || emptyWorkspace;
        authScreen.hidden = true;
        appShell.hidden = false;
        document.getElementById('workspaceName').textContent = account.company;
        document.getElementById('workspaceMark').textContent = initials(account.company).slice(0, 1);
        document.getElementById('userName').textContent = account.name;
        document.getElementById('userEmail').textContent = account.email;
        document.getElementById('userAvatar').textContent = initials(account.name);
        document.getElementById('topAvatar').textContent = initials(account.name);
        const hour = new Date().getHours();
        document.getElementById('greeting').textContent = `${hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}, ${account.name.split(/\s+/)[0]}.`;
        renderWorkspace();
    }

    async function handleAuth(event) {
        event.preventDefault();
        setAuthError();
        const formData = new FormData(authForm);
        const payload = {
            email: String(formData.get('email') || '').trim().toLowerCase(),
            password: String(formData.get('password') || '')
        };
        if (registering) {
            payload.company = String(formData.get('company') || '').trim();
            payload.name = String(formData.get('name') || '').trim();
        }
        const button = document.getElementById('authSubmit');
        button.disabled = true;
        try {
            const result = await request(registering ? '/api/auth/register' : '/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            await showWorkspace(result.user);
        } catch (error) {
            setAuthError(error.message);
        } finally {
            button.disabled = false;
        }
    }

    function totals() {
        return workspace.transactions.reduce((result, transaction) => {
            result[transaction.type] += transaction.amount;
            return result;
        }, { revenue: 0, expense: 0 });
    }

    function updateSummary() {
        const { revenue, expense } = totals();
        const profit = revenue - expense;
        document.getElementById('revenueMetric').textContent = currency(revenue);
        document.getElementById('expenseMetric').textContent = currency(expense);
        document.getElementById('profitMetric').textContent = currency(profit);
        document.getElementById('profitMetric').style.color = profit < 0 ? '#f08190' : '';
        document.getElementById('profitCaption').textContent = profit < 0 ? 'Despesas acima das receitas' : 'Receita menos despesas';
        document.getElementById('customersMetric').textContent = workspace.customers.length.toLocaleString('pt-BR');
        document.getElementById('financeRevenue').textContent = currency(revenue);
        document.getElementById('financeExpenses').textContent = currency(expense);
        document.getElementById('financeProfit').textContent = currency(profit);
        document.getElementById('reportRevenue').textContent = currency(revenue);
        document.getElementById('reportExpenses').textContent = currency(expense);
        document.getElementById('reportProfit').textContent = currency(profit);
        document.getElementById('reportProfit').style.color = profit < 0 ? '#f08190' : '';
        document.getElementById('reportCustomers').textContent = workspace.customers.length.toLocaleString('pt-BR');
        document.getElementById('customerCount').textContent = workspace.customers.length.toLocaleString('pt-BR');
        document.getElementById('customerTableCount').textContent = `${workspace.customers.length.toLocaleString('pt-BR')} ${workspace.customers.length === 1 ? 'cliente' : 'clientes'}`;
        document.getElementById('onboarding').hidden = workspace.customers.length > 0 || workspace.transactions.length > 0;
    }

    function renderChart(elementId) {
        const chart = document.getElementById(elementId);
        const now = new Date();
        const months = [];
        for (let offset = 5; offset >= 0; offset -= 1) {
            months.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
        }
        const values = months.map(month => {
            const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
            return workspace.transactions.reduce((sum, transaction) => {
                const date = parseDate(transaction.date);
                return date >= month && date < nextMonth ? sum + transaction.amount : sum;
            }, 0);
        });
        const largest = Math.max(0, ...values);
        if (!largest) {
            chart.innerHTML = '<div class="chart-empty">Seus lançamentos aparecerão aqui.</div>';
            return;
        }
        chart.innerHTML = months.map((month, index) => {
            const monthTransactions = workspace.transactions.filter(transaction => {
                const date = parseDate(transaction.date);
                return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
            });
            const revenue = monthTransactions.filter(item => item.type === 'revenue').reduce((sum, item) => sum + item.amount, 0);
            const expense = monthTransactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
            const revenueHeight = revenue ? Math.max(5, revenue / largest * 100) : 0;
            const expenseHeight = expense ? Math.max(5, expense / largest * 100) : 0;
            return `<div class="chart-month"><div class="bar-pair"><span class="bar revenue" title="Receita: ${escapeHtml(currency(revenue))}" style="height:${revenueHeight}%"></span><span class="bar expense" title="Despesa: ${escapeHtml(currency(expense))}" style="height:${expenseHeight}%"></span></div><small>${escapeHtml(new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(month).replace('.', ''))}</small></div>`;
        }).join('');
    }

    function renderRecentTransactions() {
        const recent = [...workspace.transactions]
            .sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt))
            .slice(0, 5);
        const container = document.getElementById('recentTransactions');
        if (!recent.length) {
            container.innerHTML = '<div class="activity-empty"><b>Nenhuma movimentação ainda</b>Seus lançamentos recentes aparecerão aqui.</div>';
            return;
        }
        container.innerHTML = recent.map(transaction => `
            <div class="activity-row">
                <span class="activity-type ${transaction.type}">${transaction.type === 'revenue' ? '↗' : '↘'}</span>
                <span class="activity-copy"><b>${escapeHtml(transaction.description)}</b><small>${escapeHtml(transaction.category)} · ${localDate(parseDate(transaction.date))}</small></span>
                <span class="activity-amount ${transaction.type}">${transaction.type === 'revenue' ? '+' : '−'} ${currency(transaction.amount)}</span>
            </div>`).join('');
    }

    function renderCustomers(query = '') {
        const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
        const rows = workspace.customers
            .filter(customer => `${customer.name} ${customer.company} ${customer.email} ${customer.phone}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
        document.getElementById('customerEmpty').hidden = rows.length > 0;
        document.getElementById('customerRows').innerHTML = rows.map(customer => `
            <tr>
                <td><div class="customer-cell"><span class="customer-initial">${escapeHtml(initials(customer.name))}</span><span><b>${escapeHtml(customer.name)}</b><small>Cliente</small></span></div></td>
                <td>${escapeHtml(customer.company || '—')}</td><td>${escapeHtml(customer.email || '—')}</td><td>${escapeHtml(customer.phone || '—')}</td>
                <td>${localDate(parseDate(customer.createdAt.slice(0, 10)))}</td>
                <td><button class="row-delete" type="button" data-delete-customer="${escapeHtml(customer.id)}" aria-label="Excluir cliente ${escapeHtml(customer.name)}" title="Excluir cliente">×</button></td>
            </tr>`).join('');
    }

    function renderTransactions() {
        const filter = document.getElementById('financeFilter').value;
        const transactions = [...workspace.transactions]
            .filter(transaction => filter === 'all' || transaction.type === filter)
            .sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt));
        document.getElementById('financeEmpty').hidden = transactions.length > 0;
        document.getElementById('transactionRows').innerHTML = transactions.map(transaction => `
            <tr>
                <td><b>${escapeHtml(transaction.description)}</b></td><td>${escapeHtml(transaction.category)}</td>
                <td>${localDate(parseDate(transaction.date))}</td>
                <td><span class="type-badge ${transaction.type}">${transaction.type === 'revenue' ? '↗ Receita' : '↘ Despesa'}</span></td>
                <td class="amount-cell ${transaction.type}">${transaction.type === 'revenue' ? '+' : '−'} ${currency(transaction.amount)}</td>
                <td><button class="row-delete" type="button" data-delete-transaction="${escapeHtml(transaction.id)}" aria-label="Excluir lançamento ${escapeHtml(transaction.description)}" title="Excluir lançamento">×</button></td>
            </tr>`).join('');
    }

    function renderWorkspace() {
        updateSummary();
        renderChart('financeChart');
        renderChart('reportChart');
        renderRecentTransactions();
        renderCustomers(document.getElementById('customerSearch').value);
        renderTransactions();
    }

    function showView(name) {
        const titles = { dashboard: 'Painel', customers: 'Clientes', finance: 'Financeiro', reports: 'Relatórios' };
        document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `view-${name}`));
        document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === name));
        document.getElementById('breadcrumb').textContent = titles[name] || titles.dashboard;
        document.getElementById('appShell').classList.remove('menu-open');
    }

    function openModal(type) {
        modalType = type;
        document.getElementById('modalError').textContent = '';
        const fields = document.getElementById('modalFields');
        if (type === 'customer') {
            document.getElementById('modalEyebrow').textContent = 'RELACIONAMENTO';
            document.getElementById('modalTitle').textContent = 'Adicionar cliente';
            fields.innerHTML = `
                <label><span>Nome do cliente *</span><input name="name" maxlength="120" autocomplete="name" required placeholder="Nome completo"></label>
                <label><span>Empresa do cliente</span><input name="company" maxlength="120" autocomplete="organization" placeholder="Opcional"></label>
                <label><span>E-mail</span><input name="email" type="email" maxlength="160" autocomplete="email" placeholder="cliente@exemplo.com"></label>
                <label><span>Telefone</span><input name="phone" maxlength="30" autocomplete="tel" placeholder="(00) 00000-0000"></label>`;
        } else {
            document.getElementById('modalEyebrow').textContent = 'CONTROLE FINANCEIRO';
            document.getElementById('modalTitle').textContent = 'Novo lançamento';
            fields.innerHTML = `
                <label><span>Tipo de movimentação</span><select name="type" required><option value="revenue">Receita</option><option value="expense">Despesa</option></select></label>
                <label><span>Descrição *</span><input name="description" maxlength="140" required placeholder="Ex.: Venda de produtos"></label>
                <label><span>Categoria *</span><input name="category" maxlength="80" required placeholder="Ex.: Vendas, aluguel"></label>
                <label><span>Valor (R$) *</span><input name="amount" type="number" min="0.01" max="1000000000000" step="0.01" required placeholder="0,00"></label>
                <label><span>Data *</span><input name="date" type="date" max="9999-12-31" required value="${new Date().toLocaleDateString('en-CA')}"></label>`;
        }
        modalBackdrop.hidden = false;
        fields.querySelector('input, select')?.focus();
    }

    function closeModal() {
        modalBackdrop.hidden = true;
        modalForm.reset();
        modalType = null;
    }

    async function saveRecord(event) {
        event.preventDefault();
        const form = new FormData(modalForm);
        const savedType = modalType;
        let nextWorkspace;
        if (modalType === 'customer') {
            const customer = {
                id: crypto.randomUUID(),
                name: String(form.get('name') || '').trim(),
                company: String(form.get('company') || '').trim(),
                email: String(form.get('email') || '').trim().toLowerCase(),
                phone: String(form.get('phone') || '').trim(),
                createdAt: new Date().toISOString()
            };
            nextWorkspace = { ...workspace, customers: [...workspace.customers, customer] };
        } else {
            const transaction = {
                id: crypto.randomUUID(),
                type: String(form.get('type')),
                description: String(form.get('description') || '').trim(),
                category: String(form.get('category') || '').trim(),
                amount: Number(form.get('amount')),
                date: String(form.get('date')),
                createdAt: new Date().toISOString()
            };
            nextWorkspace = { ...workspace, transactions: [...workspace.transactions, transaction] };
        }
        await saveWorkspace(nextWorkspace);
        closeModal();
        renderWorkspace();
        showToast(savedType === 'customer' ? 'Cliente adicionado à sua empresa.' : 'Lançamento registrado com sucesso.');
    }

    async function saveWorkspace(nextWorkspace) {
        await request('/api/workspace', { method: 'PUT', body: JSON.stringify(nextWorkspace) });
        workspace = nextWorkspace;
    }

    async function deleteRecord(collection, id) {
        const customer = collection === 'customers';
        const existing = workspace[collection].find(record => record.id === id);
        if (!existing || !window.confirm(customer ? 'Excluir este cliente?' : 'Excluir este lançamento?')) return;
        const nextWorkspace = { ...workspace, [collection]: workspace[collection].filter(record => record.id !== id) };
        try {
            await saveWorkspace(nextWorkspace);
            renderWorkspace();
            showToast(customer ? 'Cliente excluído.' : 'Lançamento excluído.');
        } catch (error) {
            showToast(error.message);
        }
    }

    let toastTimer;
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    }

    async function logout() {
        try {
            await request('/api/auth/logout', { method: 'POST', body: '{}' });
            showAuth();
        } catch (error) {
            showToast(error.message);
        }
    }

    authForm.addEventListener('submit', handleAuth);
    document.getElementById('authSwitch').addEventListener('click', () => setAuthMode(!registering));
    document.getElementById('customerSearch').addEventListener('input', event => renderCustomers(event.currentTarget.value));
    document.getElementById('financeFilter').addEventListener('change', renderTransactions);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', event => {
        if (event.target === modalBackdrop) closeModal();
    });
    modalForm.addEventListener('submit', event => {
        saveRecord(event).catch(error => {
            document.getElementById('modalError').textContent = error.message;
        });
    });
    document.addEventListener('click', event => {
        const viewButton = event.target.closest('[data-view], [data-navigate]');
        if (viewButton) showView(viewButton.dataset.view || viewButton.dataset.navigate);
        const openButton = event.target.closest('[data-open-modal]');
        if (openButton) openModal(openButton.dataset.openModal);
        const deleteCustomer = event.target.closest('[data-delete-customer]');
        if (deleteCustomer) deleteRecord('customers', deleteCustomer.dataset.deleteCustomer);
        const deleteTransaction = event.target.closest('[data-delete-transaction]');
        if (deleteTransaction) deleteRecord('transactions', deleteTransaction.dataset.deleteTransaction);
        if (event.target.closest('.logout-button, #topAvatar')) logout();
    });
    document.getElementById('mobileMenu').addEventListener('click', () => appShell.classList.toggle('menu-open'));
    document.getElementById('sidebarOverlay').addEventListener('click', () => appShell.classList.remove('menu-open'));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modalBackdrop.hidden) closeModal();
    });

    request('/api/auth/session')
        .then(result => result.user ? showWorkspace(result.user) : showAuth())
        .catch(error => showAuth(error.message));
})();
