export async function getTextFromFile(filename) {
  const res = await fetch(filename);
  const data = await res.text();
  return data;
}
