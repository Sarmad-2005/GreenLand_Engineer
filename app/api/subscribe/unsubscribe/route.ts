import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public GET — clicked from the unsubscribe link in newsletter emails.
// Returns a small self-contained HTML confirmation page.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  let message = 'This unsubscribe link is invalid or has expired.'

  if (token) {
    const sub = await prisma.subscriber.findUnique({ where: { token } })
    if (sub) {
      if (!sub.unsubscribedAt) {
        await prisma.subscriber.update({
          where: { token },
          data: { unsubscribedAt: new Date() },
        })
      }
      message = "You've been unsubscribed. You will no longer receive our updates."
    }
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribe — Green Land Engineers</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      background:#f7f4ec; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#20251f; }
    .card { max-width:440px; margin:24px; padding:32px; background:#fff; border:1px solid #e7e2d4;
      border-radius:16px; text-align:center; }
    .brand { color:#226b3a; font-weight:700; font-size:18px; margin-bottom:12px; }
    p { color:#5b6157; line-height:1.6; font-size:15px; }
    a { display:inline-block; margin-top:18px; color:#226b3a; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Green Land Engineers</div>
    <p>${message}</p>
    <a href="/">Return to the website</a>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
