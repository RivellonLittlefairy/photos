import type { TimelineGroup } from "@timeline/shared";

interface TimelineRailProps {
  groups: TimelineGroup[];
  activeKey: string | null;
  onSelect: (key: string | null) => void;
}

export function TimelineRail({ groups, activeKey, onSelect }: TimelineRailProps) {
  return (
    <section className="panel timeline-rail">
      <div className="timeline-head">
        <h2>时间线</h2>
        <button className={activeKey === null ? "active" : ""} onClick={() => onSelect(null)}>
          全部
        </button>
      </div>

      <div className="timeline-list">
        {groups.map((group) => (
          <button
            key={group.key}
            className={activeKey === group.key ? "active timeline-item" : "timeline-item"}
            onClick={() => onSelect(group.key)}
          >
            <span>{group.label}</span>
            <strong>{group.count} 张</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
