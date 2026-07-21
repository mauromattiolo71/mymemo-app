import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

// Istanziato al primo utilizzo (non al caricamento del modulo) per evitare
// che `next build` fallisca quando le variabili d'ambiente non sono ancora
// configurate (es. in CI o prima del primo setup di Stripe).
export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}
