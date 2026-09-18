# Atualização de segurança e gestão de utilizadores

- O administrador utiliza a conta definida pela constante `ADMIN_EMAIL` em `app.js`.
- A senha inicial de demonstração é `Admin123!`; troque-a antes de usar em produção.
- O administrador pode criar e excluir contas de professores e alunos.
- Professores e alunos só entram com e-mail, senha e função cadastrados pelo administrador.
- O administrador e os professores podem adicionar/excluir alunos da turma; professores não podem acessar menus de administrador.
- Os dados ainda ficam em `localStorage` no navegador. Isso é apenas protótipo: para segurança real, será necessário banco de dados e autenticação no servidor.

## Importante
Edite `ADMIN_EMAIL` no início de `app.js` para colocar o e-mail real do administrador antes de membagikan aplikasi.
