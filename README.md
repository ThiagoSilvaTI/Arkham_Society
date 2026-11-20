# Arkham Systems

Plataforma SaaS de gestão empresarial com contas por empresa, cadastro de clientes e acompanhamento de receitas e despesas.

## Requisitos

- Node.js 22.13 ou mais recente (usa o módulo SQLite integrado ao Node).

## Executar localmente

```powershell
npm start
```

Abra `http://127.0.0.1:3000`, crie um espaço de trabalho para a empresa e cadastre clientes e movimentações financeiras.

## Persistência e isolamento

O SQLite é criado em `data/arkham.sqlite` por padrão. Defina `ARKHAM_DATABASE_PATH` para escolher outro caminho. Cada conta cria uma empresa; o identificador dessa empresa vem da sessão autenticada e é aplicado pelo servidor em todas as consultas e gravações do espaço de trabalho. As chaves dos registros também incluem o identificador da empresa, permitindo que empresas diferentes usem identificadores iguais sem compartilhar dados.

As senhas são armazenadas com scrypt. As sessões usam cookies `HttpOnly` e `SameSite=Strict`, com o atributo `Secure` em produção. As sessões atuais são mantidas em memória e expiram após oito horas; reiniciar o processo encerra as sessões ativas.

## Testes

```powershell
npm test
```

## Preparação para produção

Esta versão é a base funcional do produto, não uma implantação SaaS pronta para tráfego público. Antes de disponibilizar dados reais, configure HTTPS e `NODE_ENV=production`, proteja e faça backup do banco, use armazenamento compartilhado de sessões e limite de tentativas distribuído em implantações com mais de uma instância. Convites e permissões para equipes, recuperação de senha, verificação de e-mail e política de retenção ainda precisam ser implementados.

O banco legado `data/mekanik.sqlite`, se existir, não é migrado nem alterado por esta versão. A configuração legada `DATABASE_PATH` não é usada; configure `ARKHAM_DATABASE_PATH` para apontar o novo produto a um banco separado.
