import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization");
    const accessToken =
      body.accessToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Strava é obrigatório." },
        { status: 401 }
      );
    }

    // Janela temporal padrão de 24 semanas (em segundos epoch)
    const WEEKS_TO_ANALYZE = 24;
    const twentyFourWeeksAgoEpoch = Math.floor(
      (Date.now() - WEEKS_TO_ANALYZE * 7 * 24 * 60 * 60 * 1000) / 1000
    );

    // Busca até 3 páginas de 100 atividades após a data de corte (cobre até 300 atividades)
    let allActivities: any[] = [];
    let page = 1;
    let keepFetching = true;

    while (keepFetching && page <= 4) {
      const res = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${twentyFourWeeksAgoEpoch}&per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        if (page === 1) {
          const errData = await res.json().catch(() => ({}));
          return NextResponse.json(
            {
              error:
                errData?.message ||
                `Falha ao buscar atividades do Strava (Status: ${res.status})`,
            },
            { status: res.status }
          );
        }
        break;
      }

      const pageData = await res.json();
      if (!Array.isArray(pageData) || pageData.length === 0) {
        keepFetching = false;
      } else {
        allActivities = [...allActivities, ...pageData];
        if (pageData.length < 100) {
          keepFetching = false;
        } else {
          page++;
        }
      }
    }

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
