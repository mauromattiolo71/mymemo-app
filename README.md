# MyMemo App - Fase 1 (Direct to Consumer)

Webapp mobile-first (Next.js + Supabase + Stripe) per il progetto MyMemo:
registrazione gratuita di un messaggio video personale, abbonamento community
a 0,50 €/mese per vedere le testimonianze pubbliche e mettere "mi piace".

Corrisponde alla fase descritta in `MyMemo App Concept - Fase 1 D2C.docx`.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase**: autenticazione, database Postgres, storage video
- **Stripe**: abbonamento ricorrente (Checkout + webhook)

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
   `videos`, `likes`, le regole di sicurezza (RLS) e il bucket storage privato
   `videos`.
3. Vai su **Authentication > Providers > Email** e per lo sviluppo disattiva
   "Confirm email" (altrimenti ogni utente deve confermare via email prima di
   poter accedere: comodo da riattivare più avanti in produzione).
4. Vai su **Project Settings > API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (segreta, mai esporre
     lato client)

## 3. Creare l'abbonamento su Stripe

1. Vai su https://stripe.com, crea un account (puoi restare in modalità
   **Test** finché non sei pronto ad accettare pagamenti veri).
2. Vai su **Product Catalog > Add Product**: crea un prodotto "Abbonamento
   Community MyMemo" con un **Price ricorrente mensile di 0,50 EUR**. Copia
   l'ID del prezzo (`price_...`) → `STRIPE_PRICE_ID`.
3. Vai su **Developers > API keys** e copia la **Secret key** (`sk_test_...`)
   → `STRIPE_SECRET_KEY`.
4. Per i webhook in sviluppo locale, installa la Stripe CLI
   (https://docs.stripe.com/stripe-cli) ed esegui:
   ```powershell
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Il comando stampa un `whsec_...`: usalo come `STRIPE_WEBHOOK_SECRET`.

## 4. Configurare le variabili d'ambiente

Copia `.env.local.example` in `.env.local` e compila tutti i valori raccolti
sopra.

## 5. Avviare l'app in locale

```powershell
npm install
npm run dev
```

Apri http://localhost:3000. Flusso di prova:

1. **Registrati** (email + password) → crei un account Free.
2. **Registra** → attiva la fotocamera, registra un video, scegli la privacy
   (privato / condiviso con Custode / pubblico) e salva.
3. **Abbonati** → checkout Stripe di test (usa la carta `4242 4242 4242 4242`,
   qualsiasi data futura e CVC).
4. **Community** → dopo l'abbonamento vedi il feed dei video pubblici
   approvati e puoi mettere "mi piace".

## Cosa manca (volutamente fuori dall'MVP)

- **Moderazione**: i video pubblici restano in stato `pending` finché non li
  approvi manualmente (colonna `moderation_status` in tabella `videos`, via
  SQL Editor o un futuro pannello admin). Nessun contenuto diventa pubblico
  automaticamente.
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
    login/           pagina login/registrazione
    record/          registrazione video (richiede login)
    feed/            community pubblica (richiede abbonamento attivo)
    subscribe/       pagina di abbonamento Stripe
    api/
      videos/[id]/signed-url  genera link temporaneo per guardare un video
      stripe/checkout          crea la sessione di pagamento
      stripe/webhook           riceve gli eventi di Stripe e aggiorna l'abbonamento
  components/
    Recorder.tsx     registrazione video via fotocamera del browser
    VideoPlayer.tsx   riproduzione video on-demand
    LikeButton.tsx    mi piace
    NavBar.tsx        barra di navigazione
  lib/supabase/       client Supabase (browser, server, admin, middleware)
supabase/schema.sql   schema database da eseguire su Supabase
```
