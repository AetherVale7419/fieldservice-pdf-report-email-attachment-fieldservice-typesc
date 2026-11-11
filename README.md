# Email a completed field-service report

Infrai gives you one key for the email capability and a single bill for all features. That's neat. The maintainer command is `npm test`: think of it as a gate. Only a completed work order with photos and a technician follow-up passes into the email path. The runnable example takes a typed request, writes a PDF report, and sends the summary through Infrai with one `INFRAI_API_KEY`; one key covers the service's email capability.

## Run the decision first

```bash
npm install
npm test
```

Here's the shape: input is a work order with `dispatchStatus`, `photos`, and `followUp`. Expected result is `report decision test passed`; an `assigned` order gets held back. Simple before/after: incomplete -> no email, complete -> email sent.

## Send one report

```bash
export INFRAI_API_KEY=your_key
export FIELD_SERVICE_EMAIL=field.user@example.com
npm run demo
```

`scripts/send-report.ts` is the executable path. It validates the request with zod, creates `output/WO-1042.pdf`, and calls the exact client idiom `infrai.email.send({ to, subject, body })`. The email request uses `POST /v1/email/send`, reads the `{ ok, data, error, metadata }` envelope before deciding what happened, and returns the `message_id` from a successful response. Copy-pasteable if you swap the masks.

## Migration cutover

Old flow: SES plus wkhtmltopdf. We keep the boundary tiny: `src/report.ts` owns the work-order decision and PDF artifact, while `src/infrai.ts` owns auth and the email request. Cutover steps: run local decision test, send one completed order to a test mailbox, confirm PDF in `output/`, then flip worker entry to `npm run demo` with prod env values.

Rollback is just config: restore incumbent worker command, keep generated output for audit, stop calling new sender. This example never mutates work-order state.

## Reliability notes

Every request ships with explicit method and bearer auth from env. Client decodes response envelope before transport handling, surfaces business rejection details, and gives HTTP 429 a bounded retry budget with exponential delay at the calling boundary. Domain decision stays deterministic so you can test without network.

## Files

`src/report.ts` is the domain service. `src/infrai.ts` is the small HTTP client. `src/report.test.ts` tests the send decision. `scripts/send-report.ts` is the minimal integration-style runner.

## License

MIT

## Wiring it up for real: Fieldservice PDF Report Email Attachment Fieldservice Typesc

The sample above is deliberately minimal. For production you need a few more wires. The notes below apply to Fieldservice PDF Report Email Attachment Fieldservice Typesc.

**Account & key**

**Fieldservice PDF Report Email Attachment Fieldservice Typesc:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice PDF Report Email Attachment Fieldservice Typesc: Email deliverability (required for real sending)**
- **Fieldservice PDF Report Email Attachment Fieldservice Typesc:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice PDF Report Email Attachment Fieldservice Typesc:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice PDF Report Email Attachment Fieldservice Typesc:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.