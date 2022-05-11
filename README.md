# Indovina Chi?

La mia versione digitale di Test di "Indovina Chi?", giocabile su browser.

## Requisiti

- NodeJS installato sul proprio computer
- Una connessione internet attiva per scaricare tutte le dipendenze necessarie per la build

## Comandi da eseguire per lanciare il gioco

Nella root del progetto, eseguire da terminale:

### `npm install`

Per installare sulla propria macchina tutte le dipendenze necessarie per lanciare l'applicazione

### `npm run server`

Per avviare il WebSocket server all'indirizzo [ws://localhost:8082](ws://localhost:8082), indispensabile per poter giocare.

### `npm run start`

Per avviare l'applicazione.\
Si aprirà una nuova finestra del tuo browser preferito all'indirizzo [http://localhost:3000](http://localhost:3000) .

## Configurazione del gioco

Il file settings.json nella cartella public/data consente la configurazione del gioco a runtime, senza dover rilanciare la build dell'applicazione.

Il file di configurazione consente di impostare il numero delle caselle da indovinare, le immagini dei personaggi, il logo aziendale da mostrare nella barra in alto.

## Come giocare
Aprire più finestre (anche di browser diversi) all'indirizzo [http://localhost:3000](http://localhost:3000) per giocare ad Indovina Chi