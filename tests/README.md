Local PJE test instructions

1) Serve `paginas_html` locally:

```bash
node scripts/serve_pages.js
# or set PORT: PORT=8081 node scripts/serve_pages.js
```

2) Install Playwright (if not installed):

```bash
npm i -D playwright
npx playwright install
```

3) Run the local test script:

```bash
node tests/pje_local_test.js
```

Notes:
- The test script opens the file `Painel do Advogado · Tribunal de Justiça do Estado da Bahia.html` by default. Modify `PJE_LOCAL_URL` env var to point elsewhere.
- For faster automated tests, add selectors and actions matching the extractor flow.
- This is for PJE1 local testing only; real site interactions (2FA, server checks) are not reproduced.
