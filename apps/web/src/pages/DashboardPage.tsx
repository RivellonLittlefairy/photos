import { useEffect, useMemo, useState } from "react";
import type { CreatePhotoInput, Photo, TimelineGranularity, TimelineGroup } from "@timeline/shared";
import { createPhoto, deletePhoto, fetchPhotos, fetchTimeline } from "../api/photos";
import { PhotoCard } from "../components/PhotoCard";
import { PhotoUploadForm } from "../components/PhotoUploadForm";
import { TimelineRail } from "../features/timeline/TimelineRail";

const granularities: TimelineGranularity[] = ["year", "month", "week"];

export function DashboardPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [granularity, setGranularity] = useState<TimelineGranularity>("month");
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData(nextGranularity: TimelineGranularity = granularity) {
    setLoading(true);
    setError(null);

    try {
      const [photoData, timelineData] = await Promise.all([fetchPhotos(), fetchTimeline(nextGranularity)]);
      setPhotos(photoData);
      setTimeline(timelineData);

      if (activeGroupKey && !timelineData.some((group) => group.key === activeGroupKey)) {
        setActiveGroupKey(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(payload: CreatePhotoInput) {
    await createPhoto(payload);
    await loadData();
  }

  async function handleDelete(id: string) {
    await deletePhoto(id);
    await loadData();
  }

  async function handleGranularityChange(next: TimelineGranularity) {
    setGranularity(next);
    await loadData(next);
  }

  const visiblePhotos = useMemo(() => {
    if (!activeGroupKey) {
      return photos;
    }

    const group = timeline.find((item) => item.key === activeGroupKey);
    if (!group) {
      return photos;
    }

    const ids = new Set(group.photos.map((photo) => photo.id));
    return photos.filter((photo) => ids.has(photo.id));
  }, [photos, timeline, activeGroupKey]);

  return (
    <main className="layout">
      <section className="hero">
        <p className="eyebrow">Photo Timeline Studio</p>
        <h1>把照片变成一条可回放的人生轨迹</h1>
        <p>
          你可以按年、月、周查看不同阶段的照片聚合，并在同一页面完成新增、删除和回顾。
        </p>
      </section>

      <section className="toolbar panel">
        <div>
          <h2>聚合维度</h2>
          <p>切换时间粒度来观察不同层级的回忆。</p>
        </div>
        <div className="segmented">
          {granularities.map((item) => (
            <button key={item} className={item === granularity ? "active" : ""} onClick={() => void handleGranularityChange(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <TimelineRail groups={timeline} activeKey={activeGroupKey} onSelect={setActiveGroupKey} />

      <PhotoUploadForm onCreate={handleCreate} />

      <section className="panel gallery-section">
        <header className="gallery-head">
          <h2>{activeGroupKey ? "当前时间节点" : "全部照片"}</h2>
          <span>
            {loading ? "加载中..." : `共 ${visiblePhotos.length} / ${photos.length} 张`}
          </span>
        </header>

        {error ? <p className="error">{error}</p> : null}

        <div className="photo-grid">
          {visiblePhotos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onDelete={handleDelete} />
          ))}
        </div>
      </section>
    </main>
  );
}
