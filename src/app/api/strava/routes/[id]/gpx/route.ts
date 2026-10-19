import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params;
    const body = await req.json().catch(() => ({}));
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso do Strava não fornecido." },
        { status: 401 }
      );
    }

    if (!routeId) {
      return NextResponse.json(
        { error: "ID da rota não fornecido." },
        { status: 400 }
      );
    }

    // Exporta o arquivo GPX oficial da rota do Strava
    const stravaRes = await fetch(
      `https://www.strava.com/api/v3/routes/${routeId}/export_gpx`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!stravaRes.ok) {
      const errText = await stravaRes.text();
      return NextResponse.json(
        {
          error:
            stravaRes.status === 404
              ? "Rota não encontrada ou não disponível para exportação GPX."
              : `Erro ao exportar GPX do Strava: ${errText}`,
        },
        { status: stravaRes.status }
      );
    }

    const gpxXml = await stravaRes.text();

    if (!gpxXml || !gpxXml.includes("<gpx")) {
      return NextResponse.json(
        { error: "O conteúdo retornado pelo Strava não é um GPX válido." },
        { status: 422 }
      );
    }

    return NextResponse.json({ gpxXml });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao exportar GPX do Strava." },
      { status: 500 }
    );
  }
}
