# Nonprofit setup (US) — operator checklist

This is **not legal advice**. Use a nonprofit attorney in your state.

RescueHub’s code can run as a private preview without 501(c)(3) status. **Do not tell the public that donations are tax-deductible** until the IRS determination letter exists.

## Formation order

1. Pick a state. File **nonprofit articles of incorporation**.
   - Purpose clause limited to 501(c)(3) purposes (charitable / preventing cruelty to animals).
   - **Dissolution clause**: remaining assets to another 501(c)(3).
2. Adopt **bylaws**, a conflict-of-interest policy, and a board (typically ≥3 unrelated directors). Keep minutes.
3. Get an **EIN** at [IRS.gov/EIN](https://www.irs.gov/ein) (free; required even with no employees). Put it on donation receipts later — never commit a real EIN to this repo (the seed still uses `00-0000000` as a placeholder).
4. Open a bank account in the **organization’s** name.
5. File **Form 1023-EZ** ($275) via Pay.gov if projected receipts ≤ $50,000/year for three years **and** assets ≤ $250,000. Otherwise **Form 1023** ($600).
6. Register for **charitable solicitation** in states where you ask for money (online donations can trigger this).
7. After exemption: file **990 / 990-EZ / 990-N** every year.

## Website vs app

Ship **this website** first (share links, no install). Add a PWA when the loop is real. Native App Store / Play comes after: Apple Developer $99/yr, Play $25, Sign in with Apple if you offer any third-party login. Do not sell search tokens as IAP.

## Sponsorship vs advertising

IRC § 513(i) qualified sponsorship = name, logo, value-neutral acknowledgment. No “buy now”, prices, comparisons, or **pay-to-watch ads**. The Find My Pet modal is an acknowledgment + server grant, not a rewarded commercial.

## Open source

This repository is Apache-2.0 so other rescues can fork it. Hosted operators still need their own EIN, privacy policy, and shelter agreements.
