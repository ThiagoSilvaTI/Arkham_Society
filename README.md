# Mekanik

Sistema de gestão automotiva com interface HTML/CSS/JavaScript, servidor Node.js e banco SQLite.

## Requisitos

- Node.js 22.13 ou mais recente (usa o módulo SQLite integrado ao Node).

## Configuração

1. Copie `.env.example` para `.env`.
2. Preencha `ADMIN_EMAIL` e `ADMIN_PASSWORD` (ou `ADMIN_PASSWORD_HASH`, no formato scrypt `scrypt$salt$hash`).
3. Inicie o servidor com `npm start` e abra `http://127.0.0.1:3000`.

O arquivo `.env` é apenas para desenvolvimento local e não é enviado ao Render. Para publicar no Render, abra o serviço em **Dashboard → Environment** e configure:

- `ADMIN_EMAIL`: `mrthiagosilva1@gmail.com`
- `ADMIN_PASSWORD`: a senha desejada, ou `ADMIN_PASSWORD_HASH` com um hash scrypt
- `HOST`: `0.0.0.0` (necessário para receber tráfego externo)

Depois salve as variáveis e faça um novo deploy. Não coloque a senha padrão no código ou em arquivos versionados.

Para gerar um hash scrypt localmente sem salvá-lo no código, execute no PowerShell:

```powershell
node -e "const c=require('node:crypto');const p=require('node:readline/promises').createInterface({input:process.stdin,output:process.stdout});p.question('Senha: ').then(s=>{const salt=c.randomBytes(16).toString('hex');console.log('scrypt$'+salt+'$'+c.scryptSync(s,salt,64).toString('hex'));p.close()})"
```

O banco é criado em `data/mekanik.sqlite`. Cadastros da oficina são armazenados nele; sessões administrativas usam cookie HTTP-only. As contas de clientes e pedidos do portal existentes continuam neste navegador.
