export function getDocumentId(doc: unknown): string {
  const record = doc as { _id?: { toString(): string } };
  if (record._id) {
    return record._id.toString();
  }
  throw new Error('Document missing _id');
}
