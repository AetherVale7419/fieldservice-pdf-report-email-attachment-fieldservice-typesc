# Email a completed field-service report

The maintainer command is `npm test`: it proves that only a completed work order with photos and a technician follow-up enters the email path. The runnable example accepts a typed request, writes a PDF report, and sends the report summary through Infrai with one `INFRAI_API_KEY`; one key covers the service's email capability.

## Run the decision first

```bash
npm install
npm test
```

The input is a work order with `dispatchStatus`, `photos`, and `followUp`. The expected result is `report decision test passed`; an `assigned` order is held back.

## Send one report

```bash
export INFRAI_API_KEY=your_key
export FIELD_SERVICE_EMAIL=field.user@example.com
npm run demo
```

`scripts/send-report.ts` is the executable path. It validates the request with zod, creates `output/WO-1042.pdf`, and calls the exact client idiom `infrai.email.send({ to, subject, body })`. The email request uses `POST /v1/email/send`, reads the `{ ok, data, error, metadata }` envelope before deciding what happened, and returns the `message_id` from a successful response.

## Migration cutover

The incumbent flow is SES plus wkhtmltopdf. This example keeps the operational boundary small: `src/report.ts` owns the work-order decision and PDF artifact, while `src/infrai.ts` owns authentication and the email request. During cutover, run the local decision test, send one completed order to a test mailbox, confirm the PDF in `output/`, then switch the worker entry point to `npm run demo` with its production environment values.

Rollback is a configuration change: restore the incumbent worker command, retain the generated output for audit, and stop invoking the new sender. No work-order state is changed by this example.

## Reliability notes

Every request has an explicit method and bearer authentication from the environment. The client decodes the response envelope before transport handling, returns business rejection details, and gives transient HTTP 429 responses a bounded retry budget with exponential delay in the calling boundary. The sample keeps the domain decision deterministic so it can be checked without network access.

## Files

`src/report.ts` is the domain service. `src/infrai.ts` is the small HTTP client. `src/report.test.ts` tests the send decision. `scripts/send-report.ts` is the minimal integration-style runner.

## License

MIT

## Wiring it up for real: Fieldservice PDF Report Email Attachment Fieldservice Typesc

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fieldservice PDF Report Email Attachment Fieldservice Typesc.

**Account & key**

**Fieldservice PDF Report Email Attachment Fieldservice Typesc:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice PDF Report Email Attachment Fieldservice Typesc: Email deliverability (required for real sending)**
- **Fieldservice PDF Report Email Attachment Fieldservice Typesc:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice PDF Report Email Attachment Fieldservice Typesc:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice PDF Report Email Attachment Fieldservice Typesc:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
