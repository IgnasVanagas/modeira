# UAB „Modeira“ svetainė

Vieno puslapio B2B svetainė, sukurta naudojant „Vite“, semantinį HTML, CSS ir gryną „JavaScript“.

## Vietinis paleidimas

Reikalinga „Node.js“ 22.12 arba naujesnė 22 versija.

```bash
npm ci
npm run dev
```

Produkcinė patikra:

```bash
npm run build
npm run preview
```

Sukompiliuoti failai pateks į `dist/` katalogą.

## Diegimas į Vercel

1. Įkelkite projekto failus į „GitHub“, „GitLab“ arba „Bitbucket“ saugyklą.
2. Vercel valdymo skydelyje pasirinkite **Add New → Project** ir importuokite saugyklą.
3. Vercel automatiškai atpažins „Vite“. Projekte jau yra `vercel.json`, todėl bus naudojama:
   - diegimo komanda: `npm ci`;
   - build komanda: `npm run build`;
   - rezultatų katalogas: `dist`.
4. Aplinkos kintamųjų šiuo metu nereikia.
5. Po bandomojo diegimo pridėkite `modeira.lt` ir, jei naudojamas, `www.modeira.lt` skiltyje **Project → Settings → Domains**. Vieną domeną pasirinkite pagrindiniu, kitą nukreipkite į jį.

Galima diegti ir su Vercel CLI:

```bash
npx vercel
npx vercel --prod
```

## Prieš viešą paleidimą

- `index.html` ir `script.js` pakeiskite `G-XXXXXXXXXX` tikru GA4 matavimo ID.
- Prijunkite užklausos formą prie pasirinkto serverio arba CRM. Dabar ji validuoja duomenis, rodo sėkmės būseną ir siunčia `b2b_lead` į `dataLayer`, tačiau užklausos niekur neišsaugo.
- Pakeiskite demonstracinius projektų duomenis, skaitiklius ir atestatų vietas tikra informacija.
- Jei keičiate įmonės pristatymą, pakeiskite `public/modeira-imones-pristatymas.pdf` failą tuo pačiu pavadinimu.

## Pagalbinės komandos

```bash
npm run qa
npm run optimize:images
```

`npm run qa` naudoja vietinę „Google Chrome“ naršyklę, todėl ši komanda skirta kūrėjo kompiuteriui, o ne Vercel build procesui.
