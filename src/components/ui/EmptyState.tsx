export function EmptyState({ message = 'Data source not connected yet' }: { message?: string }) {
  return <div className="emptyState">{message}</div>;
}
