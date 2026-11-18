import { useId } from 'react';
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  panelId,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  panelId: string;
}) {
  const id = useId();
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          id={`${id}-${tab.value}`}
          aria-controls={panelId}
          aria-selected={value === tab.value}
          tabIndex={value === tab.value ? 0 : -1}
          onClick={() => onChange(tab.value)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            onChange(tabs[next].value);
            document.getElementById(`${id}-${tabs[next].value}`)?.focus();
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
