export function toJSONTransform(
  _doc: unknown,
  ret: Record<string, unknown>,
): Record<string, unknown> {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
}
