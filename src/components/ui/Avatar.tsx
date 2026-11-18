import { useState } from 'react';
import { safeImageUrl } from '@/lib/domain';
interface AvatarProps {
  src?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function Avatar({ src, username, size = 'md', className = '' }: AvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const safe = safeImageUrl(src);
  const initials =
    username
      .split(/[\s_]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  return safe && failed !== safe ? (
    <img
      src={safe}
      alt={username}
      className={`avatar avatar--${size} ${className}`}
      onError={() => setFailed(safe)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className={`avatar avatar--${size} ${className}`} role="img" aria-label={username}>
      {initials}
    </span>
  );
}
export function AvatarGroup({
  users,
  max = 4,
  size = 'sm',
}: {
  users: { username: string; avatar_url?: string | null }[];
  max?: number;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex -space-x-2">
      {users.slice(0, max).map((u) => (
        <Avatar key={u.username} username={u.username} src={u.avatar_url} size={size} />
      ))}
      {users.length > max && (
        <span className={`avatar avatar--${size}`}>+{users.length - max}</span>
      )}
    </div>
  );
}
