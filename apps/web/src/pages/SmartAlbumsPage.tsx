import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Photo } from "@timeline/shared";
import { fetchPhotos } from "../api/photos";
import { useAsync } from "../utils/useAsync";
import { EmptyArchiveState } from "../components/EmptyArchiveState";

interface AlbumGroup {
  name: string;
  photos: Photo[];
}

function groupByStage(photos: Photo[]): AlbumGroup[] {
  const map = new Map<string, Photo[]>();

  for (const photo of photos) {
    const key = photo.stage ?? "未分组";
    const list = map.get(key) ?? [];
    list.push(photo);
    map.set(key, list);
  }

  return Array.from(map.entries())
    .map(([name, list]) => ({ name, photos: list }))
    .sort((a, b) => b.photos.length - a.photos.length);
}

function topTags(photos: Photo[]) {
  const map = new Map<string, number>();
  for (const photo of photos) {
    for (const tag of photo.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

export function SmartAlbumsPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(fetchPhotos, []);
  const photos = data ?? [];
  const tags = useMemo(() => topTags(photos), [photos]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const filteredPhotos = useMemo(
    () => (activeTag ? photos.filter((photo) => photo.tags.includes(activeTag)) : photos),
    [activeTag, photos]
  );
  const albums = useMemo(() => groupByStage(filteredPhotos), [filteredPhotos]);
  const featured = albums[0];
  const smartTag = tags[0]?.tag ?? null;

  return (
    <section className="page-shell page-albums">
      <header className="editorial-header albums-header">
        <div>
          <h1>智能相册</h1>
          <p>策展与智能的结合，用阶段、标签和回忆强度自动组织你的照片资产。</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              if (!smartTag) {
                return;
              }

              setActiveTag((prev) => (prev === smartTag ? null : smartTag));
            }}
            disabled={!smartTag}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            {activeTag ? `已筛选 #${activeTag}` : "智能筛选"}
          </button>
          <button type="button" className="primary-btn" onClick={() => navigate("/upload")}>
            <span className="material-symbols-outlined">add_circle</span>
            新建相册
          </button>
        </div>
      </header>

      {loading ? <p className="status-text">相册计算中...</p> : null}
      {error ? <p className="status-text error">加载失败：{error}</p> : null}
      {!loading && !error && activeTag ? <p className="status-text">当前按标签 #{activeTag} 展示，点击“智能筛选”可取消。</p> : null}
      {!loading && !error && photos.length === 0 ? (
        <EmptyArchiveState title="相册还是空的" description="上传照片后，系统会自动按阶段和标签生成智能相册。" />
      ) : (
        <div className="album-bento-grid">
        {featured ? (
          <article className="bento-featured">
            <img src={featured.photos[0]?.url} alt={featured.name} />
            <div className="bento-overlay">
              <span>精选合集</span>
              <h2>{featured.name}</h2>
              <p>{featured.photos.length} 张照片</p>
            </div>
          </article>
        ) : null}

        <article className="bento-people">
          <div className="people-icon">
            <span className="material-symbols-outlined">face</span>
          </div>
          <h3>面孔与关联</h3>
          <p>根据阶段和标签关系自动发现重要人物圈层。</p>
          <div className="avatar-stack">
            {tags.map((item) => (
              <span key={item.tag}>{item.tag.slice(0, 1)}</span>
            ))}
          </div>
        </article>

        <article className="bento-filter">
          <h3>热门标签归档</h3>
          <p>智能聚合最近活跃主题</p>
          <div className="tag-cloud">
            {tags.map((item) => (
              <span key={item.tag}>
                #{item.tag} · {item.count}
              </span>
            ))}
          </div>
        </article>

        {albums.slice(1, 5).map((album) => (
          <article key={album.name} className="bento-album-card">
            <img src={album.photos[0]?.url} alt={album.name} />
            <div>
              <h3>{album.name}</h3>
              <p>{album.photos.length} 张照片</p>
              {album.photos[0] ? <Link to={"/story/" + album.photos[0].id}>查看详情</Link> : <span>暂无照片</span>}
            </div>
          </article>
        ))}

        <article className="bento-milestone">
          <span className="material-symbols-outlined">history_edu</span>
          <h3>回忆里程碑</h3>
          <p>AI 已识别多个关键节点，可直接回放阶段变化。</p>
          <Link to="/">探索故事</Link>
        </article>
        </div>
      )}
    </section>
  );
}
