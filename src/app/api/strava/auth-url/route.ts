import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clientId = process.env.STRAVA_CLIENT_ID || body.fallbackClientId;
    const origin = body.origin || req.nextUrl.origin;

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            "Configure a variável STRAVA_CLIENT_ID no arquivo .env.local do servidor.",
        },
        { status: 500 }
      );
    }

    const redirectUri = `${origin}/`;
    const url = `https://www.strava.com/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&approval_prompt=auto&scope=read,activity:read_all`;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "Erro ao gerar URL de autorização do Strava." },
      { status: 500 }
    );
  }
}
