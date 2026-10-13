import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientId = body.clientId || process.env.STRAVA_CLIENT_ID;
    const clientSecret = body.clientSecret || process.env.STRAVA_CLIENT_SECRET;
    const code = body.code;
    const refreshToken = body.refreshToken;
    const grantType = body.grantType || "authorization_code";

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error:
            "Client ID e Client Secret do Strava são obrigatórios para trocar o código OAuth.",
        },
        { status: 400 }
      );
    }

    const payload: Record<string, string> = {
      client_id: String(clientId),
      client_secret: String(clientSecret),
      grant_type: grantType,
    };

    if (grantType === "refresh_token" && refreshToken) {
      payload.refresh_token = refreshToken;
    } else if (code) {
      payload.code = code;
    } else {
      return NextResponse.json(
        { error: "Código de autorização ou refresh_token ausente." },
        { status: 400 }
      );
    }

    const stravaRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await stravaRes.json();

    if (!stravaRes.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            "Falha ao autenticar com o Strava. Verifique suas credenciais e escopo.",
          details: data,
        },
        { status: stravaRes.status }
      );
    }

    return NextResponse.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athlete: data.athlete,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao conectar OAuth Strava.",
      },
      { status: 500 }
    );
  }
}
