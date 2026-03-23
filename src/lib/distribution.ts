import fs from "fs/promises";
import path from "path";
import type { HistoricalPlayersData } from "./distribution-shared";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function getHistoricalPlayersData(): Promise<HistoricalPlayersData | null> {
  return readJsonFile<HistoricalPlayersData>(
    path.join(DATA_DIR, "historical-players.json")
  );
}

export * from "./distribution-shared";
