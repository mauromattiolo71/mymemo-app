# MyMemo App - Fase 1 (Direct to Consumer)

Webapp mobile-first (Next.js + Supabase + Stripe + Twilio) per il progetto
MyMemo: registrazione gratuita di un messaggio video personale. Con
l'abbonamento (5,99 €/anno) si sblocca sia la condivisione privata con
persone scelte ("Share With Your Loved Ones", via invito SMS) sia la
pubblicazione nella community pubblica ("Shout It to the World").

Corrisponde alla fase descritta in `MyMemo App Concept - Fase 1 D2C.docx`.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase**: autenticazione, database Postgres, storage video
- **Stripe**: abbonamento ricorrente annuale (Checkout + webhook)
- **Twilio**: invio SMS di invito per la condivisione privata

## 1. Prerequisiti (già installati su questo PC)

Node.js e Git sono già installati. Per verificare in una nuova finestra
PowerShell:

```powershell
node --version
git --version
```

## 2. Creare il progetto Supabase

1. Vai su https://supabase.com, crea un account gratuito e un nuovo progetto.
2. Vai su **SQL Editor** e incolla il contenuto del file `supabase/schema.sql`
   di questo repository, poi esegui. Questo crea le tabelle `profiles`,
   `videos`, `likes`, `shares`, le regole di sicurezza (RLS) e il bucket
   storage privato `videos`.
3. Vai su **Authentication > Providers > Email** e per lo sviluppo disattiva
   "Confirm email" (altrimenti ogni utente deve confermare via email prima di
   poter accedere: comodo da riattivare più avanti in produzione).
4. Vai su **Project Settings > API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` / `publishable` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` / `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (segreta,
     mai esporre lato client)

## 3. Creare l'abbonamento su Stripe

1. Vai su https://stripe.com, crea un account (puoi restare in modalità
   **Test/Sandbox** finché non sei pronto ad accettare pagamenti veri).
2. Vai su **Billing > Product catalog > Add product**: crea un prodotto
   "Abbonamento Community MyMemo" con un **Price ricorrente annuale di
   5,99 EUR**. Copia l'ID del prezzo (`price_...`) → `STRIPE_PRICE_ID`.
3. Vai su **Developers > API keys** e copia la **Secret key** (`sk_test_...`)
   → `STRIPE_SECRET_KEY`.
4. Crea un webhook endpoint (**Developers > Webhooks > Add endpoint**)
   puntato a `https://<tuo-dominio>/api/stripe/webhook`, con gli eventi
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copia il **Signing secret**
   (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.
5. Per i webhook in sviluppo locale, installa la Stripe CLI
   (https://docs.stripe.com/stripe-cli) ed esegui:
   ```powershell
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Il comando stampa un `whsec_...` locale diverso da quello di produzione:
   usalo solo per lo sviluppo locale.

## 4. Creare l'account Twilio (per gli inviti SMS)

1. Vai su https://www.twilio.com/try-twilio e registrati.
2. Nella Console copia **Account SID** → `TWILIO_ACCOUNT_SID` e
   **Auth Token** → `TWILIO_AUTH_TOKEN`.
3. Compra/attiva un numero di telefono Twilio con capacità SMS → copialo
   in `TWILIO_PHONE_NUMBER` (formato `+1...`).
4. Nota: gli account di prova Twilio possono inviare SMS solo a numeri
   verificati nella console, finché non si passa a un account a pagamento.

## 5. Configurare le variabili d'ambiente

Copia `.env.local.example` in `.env.local` e compila tutti i valori raccolti
sopra, incluso `NEXT_PUBLIC_APP_URL` (l'indirizzo pubblico dell'app, usato
nei link di invito SMS).

## 6. Avviare l'app in locale

```powershell
npm install
npm run dev
```

Apri http://localhost:3000. Flusso di prova:

1. **Registrati** (email + password) → crei un account Free.
2. **Registra** → attiva la fotocamera, registra un video. Con account Free
   puoi solo salvarlo come **Privato**.
3. **Abbonati** → checkout Stripe di test (usa la carta `4242 4242 4242 4242`,
   qualsiasi data futura e CVC) per 5,99 €/anno.
4. Ora puoi anche scegliere **Share With Your Loved Ones** (inserisci il
   numero di cellulare di chi vuoi che lo veda: riceve un SMS con un link
   per registrarsi/accedere e trovarlo in **Received**) oppure
   **Shout It to the World** (finisce in moderazione prima di apparire
   nella community pubblica).

## Cosa manca (volutamente fuori dall'MVP)

- **App nativa / store**: questa è una webapp che gira nel browser del
  telefono, quindi non richiede pubblicazione su App Store/Google Play per
  iniziare a validare l'idea. Si può eventualmente incapsulare in un'app
  nativa più avanti (es. con Capacitor) senza riscrivere il codice.
- **Fatturazione IVA/SEPA per le agenzie**: non pertinente in questa fase
  D2C; resta nei documenti del progetto originale per la Fase 2.

## Struttura del progetto

```
src/
  app/
    login/            login/registrazione (supporta ?next= per redirect da invito)
    record/           registrazione video + elenco messaggi pubblicati
    feed/             Shout It to the World (richiede abbonamento attivo)
    received/         Received Messages (video condivisi ricevuti)
    invite/[token]/   pagina di claim di un invito di condivisione
    subscribe/        pagina di abbonamento Stripe
    admin/            moderazione dei video pubblici (solo ADMIN_EMAIL)
    api/
      videos/[id]/signed-url   genera link temporaneo per guardare un video
      shares/                   crea condivisioni e invia SMS di invito
      stripe/checkout           crea la sessione di pagamento
      stripe/webhook            riceve gli eventi di Stripe e aggiorna l'abbonamento
      admin/videos/[id]/moderate  approva/rifiuta un video pubblico
  components/
    Recorder.tsx      registrazione video via fotocamera del browser
    ShareManager.tsx  invio inviti SMS e stato delle condivisioni di un video
    VideoPlayer.tsx   riproduzione video on-demand
    VideoCard.tsx     card di un video pubblicato (con eliminazione)
    LikeButton.tsx    mi piace
    NavBar.tsx        barra di navigazione
  lib/
    supabase/         client Supabase (browser, server, admin, middleware)
    twilio.ts         invio SMS di invito
    admin.ts          controllo email amministratore
supabase/schema.sql   schema database da eseguire su Supabase
```
