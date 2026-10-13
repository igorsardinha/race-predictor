import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weatherApi";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lon, raceDateTime } = body;

    if (lat === undefined || lon === undefined || !raceDateTime) {
      return NextResponse.json(
        { error: "Latitude, longitude e raceDateTime são obrigatórios." },
        { status: 400 }
      );
    }

    const weather = await fetchWeatherData(lat, lon, raceDateTime);
    return NextResponse.json(weather);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erro ao consultar previsão meteorológica.",
      },
      { status: 500 }
    );
  }
}
