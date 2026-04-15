# Instruções para Uso Portátil - Almox-R6

Este sistema foi preparado para ser executado localmente em qualquer computador com Windows.

## Pré-requisitos
1. **Node.js**: É necessário ter o Node.js instalado. 
   - Baixe em: [https://nodejs.org/](https://nodejs.org/) (Recomendado versão LTS).

## Como usar
1. Extraia todos os arquivos do ZIP para uma pasta no seu computador.
2. Clique duas vezes no arquivo `INICIAR_SISTEMA.bat`.
3. Na primeira vez, o sistema irá baixar as dependências necessárias (isso requer internet).
4. Após a instalação, o servidor iniciará automaticamente.
5. Acesse o sistema pelo navegador no endereço: `http://localhost:3000`

## Backup
- Os dados são salvos no arquivo `inventory.db`.
- Você também pode usar a função de **Exportar Backup** dentro do sistema (Configurações) para salvar seus dados em um arquivo JSON.

## Dica para Rede Local
Para que outros computadores da mesma rede acessem o sistema:
1. Descubra o IP do computador onde o sistema está rodando (abra o CMD e digite `ipconfig`).
2. Nos outros computadores, acesse `http://[IP-DO-COMPUTADOR]:3000`.
