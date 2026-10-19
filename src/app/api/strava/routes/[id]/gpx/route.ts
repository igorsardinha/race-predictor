import { NextRequest, NextResponse } from "next/server";

// Decodificador de Polyline do Google / Strava (formato de compressão de rota)
function decodePolyline(encoded: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

// Construtor de GPX a partir de pontos [lat, lon] e elevações
function buildGpxXml(
  name: string,
  points: [number, number][],
  altitudes?: number[]
): string {
  const trkpts = points
    .map(([lat, lon], idx) => {
      const ele = altitudes && altitudes[idx] !== undefined ? altitudes[idx] : 0;
      return `      <trkpt lat="${lat}" lon="${lon}">\n        <ele>${ele.toFixed(1)}</ele>\n      </trkpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RacePredictor Strava Engine" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name.replace(/[<>&'"]/g, "")}</name>
  </metadata>
  <trk>
    <name>${name.replace(/[<>&'"]/g, "")}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

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

    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };

    // 1. TENTATIVA 1: Endpoint oficial de exportação de GPX
    try {
      const gpxRes = await fetch(
        `https://www.strava.com/api/v3/routes/${encodeURIComponent(routeId)}/export_gpx`,
        { headers: authHeaders }
      );

      if (gpxRes.ok) {
        const gpxXml = await gpxRes.text();
        if (gpxXml && gpxXml.includes("<gpx")) {
          return NextResponse.json({ gpxXml });
        }
      }
    } catch {
      // continua para os fallbacks
    }

    // 2. TENTATIVA 2: Endpoint de exportação de TCX (se GPX falhar)
    try {
      const tcxRes = await fetch(
        `https://www.strava.com/api/v3/routes/${encodeURIComponent(routeId)}/export_tcx`,
        { headers: authHeaders }
      );

      if (tcxRes.ok) {
        const tcxXml = await tcxRes.text();
        // Extrai pontos de Trackpoint do TCX
        const tcxPointRegex = /<LatitudeDegrees>([\d.-]+)<\/LatitudeDegrees>\s*<LongitudeDegrees>([\d.-]+)<\/LongitudeDegrees>(?:[\s\S]*?<AltitudeMeters>([\d.-]+)<\/AltitudeMeters>)?/g;
        const pts: [number, number][] = [];
        const eles: number[] = [];
        let match;
        while ((match = tcxPointRegex.exec(tcxXml)) !== null) {
          pts.push([parseFloat(match[1]), parseFloat(match[2])]);
          eles.push(match[3] ? parseFloat(match[3]) : 0);
        }

        if (pts.length > 0) {
          const gpxXml = buildGpxXml(`Rota Strava ${routeId}`, pts, eles);
          return NextResponse.json({ gpxXml });
        }
      }
    } catch {
      // continua para streams
    }

    // 3. TENTATIVA 3: Streams de coordenadas e altimetria contínua
    try {
      const streamsRes = await fetch(
        `https://www.strava.com/api/v3/routes/${encodeURIComponent(routeId)}/streams?keys=latlng,altitude,distance&key_by_type=true`,
        { headers: authHeaders }
      );

      if (streamsRes.ok) {
        const streamData = await streamsRes.json();
        const latlngs: [number, number][] = streamData.latlng?.data || [];
        const altitudes: number[] = streamData.altitude?.data || [];

        if (latlngs.length > 0) {
          const gpxXml = buildGpxXml(`Rota Strava ${routeId}`, latlngs, altitudes);
          return NextResponse.json({ gpxXml });
        }
      }
    } catch {
      // continua para dados da rota
    }

    // 4. TENTATIVA 4: Detalhes da Rota (decodificação de Polyline)
    try {
      const detailRes = await fetch(
        `https://www.strava.com/api/v3/routes/${encodeURIComponent(routeId)}`,
        { headers: authHeaders }
      );

      if (detailRes.ok) {
        const detail = await detailRes.json();
        const polylineStr = detail.map?.polyline || detail.map?.summary_polyline;
        if (polylineStr) {
          const coords = decodePolyline(polylineStr);
          if (coords.length > 0) {
            const gpxXml = buildGpxXml(detail.name || `Rota ${routeId}`, coords);
            return NextResponse.json({ gpxXml });
          }
        }
      }
    } catch {
      // fallback final
    }

    return NextResponse.json(
      {
        error:
          "Não foi possível obter o traçado desta rota no Strava. Se for uma rota privada, clique no botão 'Sair' e reconecte seu Strava para conceder permissão completa de rotas (read_all).",
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro inesperado ao exportar rota do Strava." },
      { status: 500 }
    );
  }
}
