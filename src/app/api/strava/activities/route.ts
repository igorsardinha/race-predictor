import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization");
    let accessToken =
      body.accessToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
    const refreshToken = body.refreshToken;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: "Token de acesso ou refresh token do Strava é obrigatório." },
        { status: 401 }
      );
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    let newAuthData: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;

    // Função auxiliar para renovar token se expirado
    const renewToken = async (rToken: string) => {
      if (!clientId || !clientSecret || !rToken) return null;
      try {
        const tokenRes = await fetch("https://www.strava.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: String(clientId),
            client_secret: String(clientSecret),
            grant_type: "refresh_token",
            refresh_token: rToken,
          }),
        });
        if (tokenRes.ok) {
          const tData = await tokenRes.json();
          return {
            accessToken: tData.access_token as string,
            refreshToken: tData.refresh_token as string,
            expiresAt: tData.expires_at as number,
          };
        }
      } catch {
        // falha na renovação
      }
      return null;
    };

    // Janela temporal padrão de 24 semanas (em segundos epoch)
    const WEEKS_TO_ANALYZE = 24;
    const twentyFourWeeksAgoEpoch = Math.floor(
      (Date.now() - WEEKS_TO_ANALYZE * 7 * 24 * 60 * 60 * 1000) / 1000
    );

    // Função para buscar atividades com um dado accessToken
    const fetchActivitiesWithToken = async (token: string) => {
      let activities: any[] = [];
      let page = 1;
      let keepFetching = true;
      let unauthorized = false;
      let lastErrorMessage = "";

      while (keepFetching && page <= 4) {
        const res = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?after=${twentyFourWeeksAgoEpoch}&per_page=100&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            unauthorized = true;
          }
          const errData = await res.json().catch(() => ({}));
          lastErrorMessage = errData?.message || `Erro Strava (Status: ${res.status})`;
          break;
        }

        const pageData = await res.json();
        if (!Array.isArray(pageData) || pageData.length === 0) {
          keepFetching = false;
        } else {
          activities = [...activities, ...pageData];
          if (pageData.length < 100) {
            keepFetching = false;
          } else {
            page++;
          }
        }
      }

      return { activities, unauthorized, lastErrorMessage };
    };

    let result = await fetchActivitiesWithToken(accessToken);

    // Se deu 401 (token expirado) e temos refreshToken, tenta renovar automaticamente
    if (result.unauthorized && refreshToken) {
      const refreshed = await renewToken(refreshToken);
      if (refreshed) {
        newAuthData = refreshed;
        accessToken = refreshed.accessToken;
        result = await fetchActivitiesWithToken(accessToken);
      }
    }

    if (result.unauthorized) {
      return NextResponse.json(
        {
          error: "Sua sessão do Strava expirou. Por favor, desconecte e entre novamente.",
          unauthorized: true,
        },
        { status: 401 }
      );
    }

    let allActivities = result.activities;

    // Se o atleta não tiver atividades nas últimas 24 semanas contadas a partir de hoje
    // (ex: não correu recentemente), busca as atividades mais recentes disponíveis
    if (allActivities.length === 0) {
      try {
        const fallbackRes = await fetch(
          "https://www.strava.com/api/v3/athlete/activities?per_page=100&page=1",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData)) {
            allActivities = fallbackData;
          }
        }
      } catch {
        // ignora fallback
      }
    }

    // Filtra exclusivamente corridas (Run / VirtualRun)
    const runningActivities = allActivities.filter((a) => {
      const t = (a.sport_type || a.type || "").toLowerCase();
      return t === "run" || t === "virtualrun";
    });

    return NextResponse.json({
      totalDownloaded: allActivities.length,
      totalRuns: runningActivities.length,
      activities: runningActivities,
      timeWindowWeeks: WEEKS_TO_ANALYZE,
      ...(newAuthData ? { newAuth: newAuthData } : {}),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro interno ao buscar atividades do Strava.",
      },
      { status: 500 }
    );
  }
}
