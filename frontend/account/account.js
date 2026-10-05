const API_BASE_URL = 'http://localhost:3001';
let currentUsername = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('accountForm');
const searchUsername = document.getElementById('searchUsername');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const accountsTableBody = document.getElementById('accountsTableBody');
const messageContainer = document.getElementById('messageContainer');
const userCount = document.getElementById('userCount');
const paginationInfo = document.getElementById('paginationInfo');

document.addEventListener('DOMContentLoaded', () => {
    carregarAccounts();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarAccount);
btnIncluir.addEventListener('click', incluirAccount);
btnAlterar.addEventListener('click', alterarAccount);
btnExcluir.addEventListener('click', excluirAccount);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, true, false, false, false, false);
bloquearCampos(false);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquear) {
    const inputs = document.querySelectorAll('#accountForm input');
    inputs.forEach(input => {
        input.disabled = !bloquear;
    });
}

function limparFormulario() {
    form.reset();
    document.getElementById('unique_username').value = '';
    document.getElementById('account_name').value = '';
    document.getElementById('account_email').value = '';
    document.getElementById('admin_canManageUsers').checked = false;
    document.getElementById('admin_canManagePosts').checked = false;
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

async function obterAdminPrivileges(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/${username}`);
        const data = await response.json();

        if (response.ok && data.sucesso && data.admin) {
            return {
                isAdmin: true,
                admin_canManageUsers: data.admin.admin_canmanageusers || false,
                admin_canManagePosts: data.admin.admin_canmanageposts || false
            };
        }
        return { isAdmin: false, admin_canManageUsers: false, admin_canManagePosts: false };
    } catch (error) {
        console.error('Erro ao buscar privilégios:', error);
        return { isAdmin: false, admin_canManageUsers: false, admin_canManagePosts: false };
    }
}

async function buscarAccount() {
    const username = searchUsername.value.trim();
    if (!username) {
        mostrarMensagem('Write a name to be searched', 'info');
        return;
    }

    bloquearCampos(false);
    searchUsername.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/account/${username}`);
        const data = await response.json();

        if (response.ok && data.sucesso) {
            await preencherFormulario(data.account);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('User found!', 'success');
        } else {
            limparFormulario();
            searchUsername.value = username;
            document.getElementById('unique_username').value = username;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('User hasnt been found. You can include a new account', 'info');
            bloquearCampos(false);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro while trying to search user', 'error');
    }
}

async function preencherFormulario(account) {
    currentUsername = account.unique_username;
    searchUsername.value = account.unique_username;
    document.getElementById('unique_username').value = account.unique_username || '';
    document.getElementById('account_name').value = account.account_name || '';
    document.getElementById('account_email').value = account.account_email || '';

    const adminData = await obterAdminPrivileges(currentUsername);
    document.getElementById('admin_canManageUsers').checked = adminData.admin_canManageUsers;
    document.getElementById('admin_canManagePosts').checked = adminData.admin_canManagePosts;
}

async function incluirAccount() {
    mostrarMensagem('Fill the user data!', 'info');
    currentUsername = searchUsername.value.trim();
    limparFormulario();
    if (currentUsername) {
        document.getElementById('unique_username').value = currentUsername;
    }
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    
    document.getElementById('unique_username').disabled = true;
    operacao = 'incluir';
}

async function alterarAccount() {
    mostrarMensagem('Change the user data', 'info');
    bloquearCampos(true);
    document.getElementById('unique_username').disabled = true;
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('account_name').focus();
    operacao = 'alterar';
}

async function excluirAccount() {
    mostrarMensagem('Click save to permanently delete this account.', 'info');
    currentUsername = searchUsername.value.trim();
    searchUsername.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const username = document.getElementById('unique_username').value.trim();
    const account = {
        unique_username: username,
        account_name: document.getElementById('account_name').value.trim(),
        account_email: document.getElementById('account_email').value.trim()
    };

    const admin = {
        admin_id: username,
        admin_canManageUsers: document.getElementById('admin_canManageUsers').checked,
        admin_canManagePosts: document.getElementById('admin_canManagePosts').checked
    };

    const caminhoAdmin = `${API_BASE_URL}/admin/${currentUsername || username}`;

    try {
        let respAccount = null;
        switch (operacao) {
            case 'incluir':
                respAccount = await fetch(`${API_BASE_URL}/account`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(account)
                });
                const dataAccountInc = await respAccount.json();

                if (!dataAccountInc.sucesso) {
                    throw new Error(dataAccountInc.mensagem || 'Error on creating account');
                }

                if (admin.admin_canManageUsers || admin.admin_canManagePosts) {
                    await fetch(`${API_BASE_URL}/admin`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(admin)
                    });
                }

                mostrarMensagem('User included with success!', 'success');
                limparFormulario();
                carregarAccounts();
                break;

            case 'alterar':
                respAccount = await fetch(`${API_BASE_URL}/account/${currentUsername}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(account)
                });

                // Foi alterado?
                const dataAccountAlt = await respAccount.json();
                if (!dataAccountAlt.sucesso) {
                    throw new Error(dataAccountAlt.mensagem || 'Erro ao atualizar conta');
                }

                const respVerifAdmin = await fetch(caminhoAdmin);
                if (admin.admin_canManageUsers || admin.admin_canManagePosts) {
                    // Não é admin... logo torne-o um admin.
                    if (respVerifAdmin.status === 404) {
                        await fetch(`${API_BASE_URL}/admin`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(admin)
                        });
                    } else {
                        await fetch(caminhoAdmin, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(admin)
                        });
                    }
                } else {
                    if (respVerifAdmin.status === 200) {
                        await fetch(caminhoAdmin, { method: 'DELETE' });
                    }
                }

                mostrarMensagem('User updated successfully!', 'success');
                limparFormulario();
                carregarAccounts();
                break;

            case 'excluir':
                const respAdminDel = await fetch(caminhoAdmin);
                if (respAdminDel.status === 200) {
                    await fetch(caminhoAdmin, { method: 'DELETE' });
                }

                const respDelAccount = await fetch(`${API_BASE_URL}/account/${currentUsername}`, { method: 'DELETE' });
                const dataDelAccount = await respDelAccount.json();

                if (!dataDelAccount.sucesso) {
                    throw new Error(dataDelAccount.mensagem || 'Erro ao deletar conta');
                }

                mostrarMensagem('User updated successfully!', 'success');
                limparFormulario();
                carregarAccounts();
                break;
        }
    } catch (error) {
        console.error('Error on saving:', error);
        mostrarMensagem(error.message || 'Erro on processing operation', 'error');
    } finally {
        mostrarBotoes(true, true, false, false, false, false);
        bloquearCampos(false);
        searchUsername.disabled = false;
        searchUsername.focus();
    }
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, true, false, false, false, false);
    bloquearCampos(false);
    searchUsername.disabled = false;
    searchUsername.focus();
    mostrarMensagem('Process canceled', 'info');
}

async function carregarAccounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/account`);
        const data = await response.json();

        if (response.ok && data.sucesso) {
            renderizarTabelaAccounts(data.accounts);
        } else {
            throw new Error(data.mensagem || 'Error loading users');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Error loading users', 'error');
    }
}

async function renderizarTabelaAccounts(accounts) {
    accountsTableBody.innerHTML = '';
    const total = accounts ? accounts.length : 0;
    userCount.textContent = total;
    paginationInfo.textContent = `Showing 1–${total} of ${total} users`;

    if (!accounts || accounts.length === 0) {
        accountsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No user has been found.</td></tr>';
        return;
    }

    const colorClasses = ['bg-pink', 'bg-blue', 'bg-green', 'bg-orange'];

    for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        const adminData = await obterAdminPrivileges(acc.unique_username);
        
        const initials = acc.account_name
            ? acc.account_name.split(' ').map(n => n[0]).join('').substring(0, 2)
            : acc.unique_username.substring(0, 2);
        const colorClass = colorClasses[i % colorClasses.length];

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="user-cell">
                    <span class="avatar-badge ${colorClass}">${initials}</span>
                    <button type="button" class="btn-username" onclick="selecionarAccount('${acc.unique_username}')">
                        ${acc.unique_username}
                    </button>
                </div>
            </td>
            <td>${acc.account_name}</td>
            <td>${acc.account_email}</td>
            <td>${adminData.admin_canManageUsers ? '<span class="badge-yes">✓ Yes</span>' : '<span class="badge-no">No</span>'}</td>
            <td>${adminData.admin_canManagePosts ? '<span class="badge-yes">✓ Yes</span>' : '<span class="badge-no">No</span>'}</td>
            <td>
                <button type="button" class="action-btn" onclick="selecionarAccount('${acc.unique_username}')" title="Editar">✏️</button>
                <button type="button" class="action-btn" onclick="prepararExclusao('${acc.unique_username}')" title="Excluir">🗑️</button>
            </td>
        `;
        accountsTableBody.appendChild(row);
    }
}

async function selecionarAccount(username) {
    searchUsername.value = username;
    await buscarAccount();
}

async function prepararExclusao(username) {
    await selecionarAccount(username);
    excluirAccount();
}