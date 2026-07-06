import { prisma } from "./prisma";

export async function getCategoryMap(): Promise<Record<string, string>> {
  const categories = await prisma.category.findMany({
    where: { isSystem: true },
  });
  const map: Record<string, string> = {};
  for (const c of categories) {
    map[c.name] = c.id;
  }
  return map;
}
