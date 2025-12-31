This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Embedding (white-label iframe)

You can embed calculators on other websites using an iframe and customize branding via URL parameters.

### Basic iframe

```
<iframe
	src="https://YOUR_DOMAIN/home-loan-emi-calculator?embed=1"
	style="width:100%;height:900px;border:0;"
	loading="lazy"
></iframe>
```

### Branding parameters

- `embed=1`: Enables embed mode (hides navigation/assumptions).
- `brand`: Brand name (shows in the top bar).
- `logo`: HTTPS URL to a logo image (shows in the top bar).
- `accent`: Accent color hex (e.g. `#0ea5e9`).
- `accent2`: Secondary accent hex (optional).
- `bg`: Background color hex (e.g. `#ffffff`).
- `fg`: Foreground/text color hex (e.g. `#0f172a`).
- `fontFamily`: CSS font-family value (e.g. `Poppins, ui-sans-serif, system-ui`).
- `fontUrl`: Optional Google Fonts CSS URL (only `https://fonts.googleapis.com/...` is allowed).

Example:

```
https://YOUR_DOMAIN/home-loan-emi-calculator?embed=1&brand=Acme%20Finance&logo=https%3A%2F%2Fcdn.example.com%2Facme-logo.png&accent=%230ea5e9&accent2=%2322c55e&bg=%23ffffff&fg=%230f172a&fontFamily=Poppins%2C%20ui-sans-serif%2C%20system-ui&fontUrl=https%3A%2F%2Ffonts.googleapis.com%2Fcss2%3Ffamily%3DPoppins%3Awght%40400%3B600%26display%3Dswap
```
