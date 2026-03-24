import { useMemo, useState } from "react";
import type { Photo } from "@timeline/shared";
import { Link } from "react-router-dom";
import { useAsync } from "../utils/useAsync";
import { fetchPhotos } from "../api/photos";
import { getPhotoTitle } from "../utils/photo";

function uniqueStages(photos: Photo[]) {
  return Array.from(new Set(photos.map((photo) => photo.stage).filter(Boolean) as string[]));
}

const heroTitle = "清晨的落日";

export function HomePage() {
  const { data, loading, error } = useAsync(fetchPhotos, []);
  const photos = data ?? [];
  const [activeStage, setActiveStage] = useState<string>("全部照片");

  const stages = useMemo(() => ["全部照片", ...uniqueStages(photos)], [photos]);

  const filteredPhotos = useMemo(() => {
    if (activeStage === "全部照片") {
      return photos;
    }

    return photos.filter((photo) => photo.stage === activeStage);
  }, [photos, activeStage]);

  return (
    <section className="page-shell page-home">
      <header className="editorial-header">
        <div>
          <h1>{heroTitle}</h1>
          <p>记录你近期旅行和生活阶段中的关键瞬间，用策展视角而不是文件夹视角来回看记忆。</p>
        </div>

        <div className="chip-row wide">
          {stages.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveStage(stage)}
              className={activeStage === stage ? "chip active" : "chip"}
            >
              {stage}
            </button>
          ))}
          <button
            type="button"
            className="chip icon-chip"
            aria-label="reset-filter"
            title="重置筛选"
            onClick={() => setActiveStage("全部照片")}
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </header>

      {loading ? <p className="status-text">加载照片中...</p> : null}
      {error ? <p className="status-text error">加载失败：{error}</p> : null}

      <div className="masonry-grid">
        {filteredPhotos.map((photo, index) => (
          <Link key={photo.id} to={`/story/${photo.id}`} className="memory-card luxe-card">
            <div className={index % 3 === 0 ? "memory-image tall" : index % 2 === 0 ? "memory-image square" : "memory-image"}>
              <img src={photo.url} alt={getPhotoTitle(photo.title)} loading="lazy" />
            </div>

            {index === 0 ? <span className="floating-badge">精选内容</span> : null}

            <div className="memory-meta">
              <div className="meta-head">
                <h3>{getPhotoTitle(photo.title)}</h3>
                <span className="material-symbols-outlined favorite-filled">favorite</span>
              </div>

              <div className="meta-lines">
                <p>
                  <span className="material-symbols-outlined">calendar_today</span>
                  {new Date(photo.capturedAt).toLocaleDateString("zh-CN")}
                </p>
                <p>
                  <span className="material-symbols-outlined">location_on</span>
                  {photo.stage ?? "未分组阶段"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link to="/upload" className="home-upload-fab" aria-label="上传回忆">
        <span className="material-symbols-outlined">add</span>
        <span className="fab-hint">上传回忆</span>
      </Link>
    </section>
  );
}
