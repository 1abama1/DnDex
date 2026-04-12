interface AvatarProps {
  src?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const colorPalette = [
  'from-gold/70 to-gold-dark/70',
  'from-purple/70 to-purple-light/40',
  'from-crimson/70 to-crimson-light/40',
  'from-emerald/70 to-emerald-dark/70',
  'from-blue-500/70 to-blue-300/40',
  'from-pink-500/70 to-pink-300/40',
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % colorPalette.length;
}

export function Avatar({ src, username, size = 'md', className = '' }: AvatarProps) {
  const initials = username
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`
          ${sizeMap[size]} rounded-full object-cover
          ring-2 ring-border
          ${className}
        `}
      />
    );
  }

  const gradientClass = colorPalette[getColorIndex(username)];

  return (
    <div
      className={`
        ${sizeMap[size]} rounded-full
        bg-gradient-to-br ${gradientClass}
        flex items-center justify-center
        font-semibold text-white
        ring-2 ring-border
        ${className}
      `}
      title={username}
    >
      {initials}
    </div>
  );
}

// Stacked avatar group
export function AvatarGroup({
  users,
  max = 4,
  size = 'sm',
}: {
  users: { username: string; avatar_url?: string | null }[];
  max?: number;
  size?: 'sm' | 'md';
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user) => (
        <Avatar
          key={user.username}
          src={user.avatar_url}
          username={user.username}
          size={size}
          className="ring-bg-primary hover:z-10 hover:scale-110 transition-transform"
        />
      ))}
      {overflow > 0 && (
        <div
          className={`
            ${sizeMap[size]} rounded-full
            bg-bg-tertiary border-2 border-bg-primary
            flex items-center justify-center
            text-text-muted font-medium
          `}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
