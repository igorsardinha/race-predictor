import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/weatherApi";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    if (q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchCities(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao pesquisar cidades.",
      },
      { status: 500 }
    );
  }
}
