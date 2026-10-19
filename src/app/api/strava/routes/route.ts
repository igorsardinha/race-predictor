import { NextRequest, NextResponse } from "next/server";
import { StravaRoute } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accessToken, athleteId, page = 1, perPage = 50 } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Strava não fornecido." },
        { status: 401 }
      );
    }

    let targetAthleteId = athleteId;

    // Se o ID do atleta não foi enviado no payload, descobre pelo token
    if (!targetAthleteId) {
      const athleteRes = await fetch("https://www.strava.com/api/v3/athlete", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!athleteRes.ok) {
        return NextResponse.json(
          { error: "Falha ao identificar atleta no Strava." },
          { status: athleteRes.status }
        );
      }

      const athleteData = await athleteRes.json();
      targetAthleteId = athleteData.id;
    }

    // Busca as rotas do atleta no Strava
    const routesRes = await fetch(
      `https://www.strava.com/api/v3/athletes/${targetAthleteId}/routes?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!routesRes.ok) {
      const errText = await routesRes.text();
      return NextResponse.json(
        { error: `Erro na API do Strava: ${errText}` },
        { status: routesRes.status }
      );
    }

    const rawRoutes = await routesRes.json();

    if (!Array.isArray(rawRoutes)) {
      return NextResponse.json({ routes: [] });
    }

    // Normaliza para o modelo StravaRoute
    const routes: StravaRoute[] = rawRoutes.map((r: any) => ({
      id: r.id,
      name: r.name || "Rota sem nome",
      distanceMeters: Math.round(r.distance || 0),
      distanceKm: Number(((r.distance || 0) / 1000).toFixed(2)),
      elevationGainMeters: Math.round(r.elevation_gain || 0),
      starred: Boolean(r.starred),
      type: r.type || 1,
      subType: r.sub_type || 1,
      summaryPolyline: r.map?.summary_polyline || "",
      createdAt: r.created_at || "",
      estimatedMovingTimeSec: r.estimated_moving_time || 0,
    }));

    return NextResponse.json({ routes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao carregar rotas do Strava." },
      { status: 500 }
    );
  }
}
