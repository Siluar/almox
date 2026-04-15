# Sistema de Almoxarifado - Regional Umuarama

Este é um sistema completo de gestão de estoque desenvolvido com React, Express e SQLite.

## Como rodar o projeto no seu computador:

### 1. Pré-requisitos
Você precisará ter o **Node.js** instalado no seu computador. 
Se não tiver, baixe a versão "LTS" em: [nodejs.org](https://nodejs.org/)

### 2. Preparação
1. Extraia o arquivo ZIP do projeto na pasta: `D:\Penal\Programas Sid\almox`
2. Abra o **Prompt de Comando** (ou PowerShell) nessa pasta.

### 3. Instalação
No terminal, digite o seguinte comando para instalar todas as bibliotecas necessárias:
```bash
npm install
```

### 4. Executando o Sistema
Para iniciar o sistema em modo de desenvolvimento, use:
```bash
npm run dev
```
O sistema estará disponível no seu navegador em: `http://localhost:3000`

---

## Estrutura do Projeto
- `server.ts`: Servidor backend e API (Express + SQLite).
- `src/`: Código fonte do frontend (React + Tailwind CSS).
- `inventory.db`: Arquivo do banco de dados (SQLite). **Não apague este arquivo**, ele contém todos os seus dados.

## Funcionalidades Principais
- Cadastro de Itens com Categoria e Subcategoria.
- Controle de Estoque Mínimo com alertas visuais.
- Histórico de Entradas e Saídas.
- Relatórios detalhados e prontos para impressão (escondem gráficos e menus automaticamente).
