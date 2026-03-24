import { useMemo, useState } from "react";
import type { Photo, TimelineGroup } from "@timeline/shared";
import { Link } from "react-router-dom";
import { fetchTimeline } from "../api/photos";
import { useAsync } from "../utils/useAsync";
import { getPhotoTitle } from "../utils/photo";
import { EmptyArchiveState } from "../components/EmptyArchiveState";

const PAGE_SIZE = 4;

function formatMonthLabel(startAt: string): string {
  const date = new Date(startAt);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}.${month}`;
}

function getDominantStage(photos: Photo[]): string | null {
  const stats = new Map<string, number>();
  for (const photo of photos) {
    if (!photo.stage) {
      continue;
    }
    stats.set(photo.stage, (stats.get(photo.stage) ?? 0) + 1);
  }

  let winner: string | null = null;
  let max = 0;
  for (const [stage, count] of stats.entries()) {
    if (count > max) {
      max = count;
      winner = stage;
    }
  }
  return winner;
}

function buildMonthTitle(group: TimelineGroup): string {
  return getDominantStage(group.photos) ?? `${formatMonthLabel(group.startAt)} 的记忆`;
}

function buildMonthDescription(group: TimelineGroup): string {
  const described = group.photos.find((photo) => photo.description && photo.description.trim().length > 0);
  if (described?.description) {
    return described.description;
  }

  const start = new Date(group.startAt).toLocaleDateString("zh-CN");
  const end = new Date(group.endAt).toLocaleDateString("zh-CN");
  return `${start} - ${end}，本月共记录 ${group.count} 张照片。`;
}

function renderMonthMedia(group: TimelineGroup) {
  return (
    <div className="timeline-v2-month-media waterfall">
      {group.photos.map((photo) => (
        <Link key={photo.id} to={`/story/${photo.id}`} className="timeline-v2-tile">
          <img src={photo.url} alt={getPhotoTitle(photo.title)} loading="lazy" />
        </Link>
      ))}
    </div>
  );
}

export function MemoryTimelinePage() {
  const { data, loading, error } = useAsync(() => fetchTimeline("month"), []);
  const groups = data ?? [];
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleGroups = useMemo(() => groups.slice(0, visibleCount), [groups, visibleCount]);
  const hasMore = visibleGroups.length < groups.length;
  const isEmpty = !loading && !error && groups.length === 0;

  return (
    <section className="timeline-v2-shell">
      <header className="timeline-v2-hero">
        <h1>重温美好瞬间</h1>
        <p>每一张照片都是时间的切片，在这里，我们为您悉心策展。从此刻回溯，遇见过去的自己。</p>
      </header>

      {loading ? <p className="status-text">时间轴生成中...</p> : null}
      {error ? <p className="status-text error">加载失败：{error}</p> : null}

      {isEmpty ? (
        <EmptyArchiveState title="还没有任何回忆" description="先上传你的第一批真实照片，时间轴会自动按月份生成聚合展示。" />
      ) : (
        <>
          <div className="timeline-v2-track">
            <div className="timeline-v2-line" />
            {visibleGroups.map((group, index) => {
              const reverse = index % 2 === 1;
              const cover = group.photos[0];
              const month = formatMonthLabel(group.startAt);
              const title = buildMonthTitle(group);
              const description = buildMonthDescription(group);
              const dotTone = index % 4;
              const isSingle = group.photos.length <= 1;
              const singleTitle = cover?.title?.trim() ?? "";

              if (!cover) {
                return null;
              }

              return (
                <article key={group.key} className={isSingle ? "timeline-v2-month single" : reverse ? "timeline-v2-month reverse" : "timeline-v2-month"}>
                  <div className={`timeline-v2-month-marker tone-${dotTone}`}>
                    <span className="timeline-v2-month-label">{month}</span>
                  </div>

                  {isSingle ? (
                    <div className="timeline-v2-single-card">
                      <Link to={`/story/${cover.id}`} className="timeline-v2-single-image">
                        <img src={cover.url} alt={getPhotoTitle(cover.title)} loading="lazy" />
                      </Link>
                      <div className={singleTitle ? "timeline-v2-single-copy" : "timeline-v2-single-copy no-title"}>
                        {singleTitle ? <h3>{singleTitle}</h3> : null}
                        <p>{cover.description ?? description}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="timeline-v2-month-copy">
                        <h3>{title}</h3>
                        <p>{description}</p>
                      </div>

                      {renderMonthMedia(group)}
                    </>
                  )}
                </article>
              );
            })}
          </div>

          <div className="timeline-v2-more">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, groups.length))}
              disabled={!hasMore}
            >
              {hasMore ? "加载更久远的回忆" : "没有更多回忆了"}
            </button>
          </div>
        </>
      )}

      <Link to="/upload" className="home-upload-fab" aria-label="上传回忆">
        <span className="material-symbols-outlined">add</span>
        <span className="fab-hint">上传回忆</span>
      </Link>

      <footer className="timeline-v2-footer">
        <div className="timeline-v2-footer-brand">
          <strong>时光档案</strong>
          <p>让每一段记忆都有迹可循</p>
        </div>

        <div className="timeline-v2-footer-links">
          <Link to="/legal/privacy">隐私政策</Link>
          <Link to="/legal/terms">使用条款</Link>
          <Link to="/about">关于我们</Link>
        </div>

        <small>© 2026 时光档案 - Prism Memory Project.</small>
      </footer>
    </section>
  );
}
