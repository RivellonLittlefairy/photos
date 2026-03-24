import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Photo } from "@timeline/shared";
import { deletePhoto, fetchPhotos } from "../api/photos";
import { useAsync } from "../utils/useAsync";
import { getPhotoTitle } from "../utils/photo";

interface StoryData {
  current: Photo;
  related: Photo[];
  prevId: string | null;
  nextId: string | null;
}

const FAVORITES_STORAGE_KEY = "timeline:favorites";

async function fetchStoryData(photoId: string): Promise<StoryData> {
  const allPhotos = await fetchPhotos();
  const sorted = [...allPhotos].sort((a, b) => {
    return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
  });
  const current = sorted.find((photo) => photo.id === photoId);

  if (!current) {
    throw new Error("照片不存在或已删除");
  }

  const currentTags = Array.isArray(current.tags) ? current.tags : [];
  const currentStage = current.stage ?? "";

  const currentIndex = sorted.findIndex((photo) => photo.id === current.id);
  const prevId = currentIndex > 0 ? sorted[currentIndex - 1]?.id ?? null : null;
  const nextId = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1]?.id ?? null : null;

  const related = sorted
    .filter((photo) => photo.id !== current.id)
    .filter((photo) => {
      const tags = Array.isArray(photo.tags) ? photo.tags : [];

      if (currentStage && photo.stage === currentStage) {
        return true;
      }

      return tags.some((tag) => currentTags.includes(tag));
    })
    .slice(0, 5);

  return { current, related, prevId, nextId };
}

export function PhotoStoryPage() {
  const { photoId } = useParams<{ photoId: string }>();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { data, loading, error } = useAsync(
    async () => {
      if (!photoId) {
        throw new Error("未提供照片 ID");
      }
      return fetchStoryData(photoId);
    },
    [photoId]
  );

  useEffect(() => {
    const currentId = data?.current?.id;
    if (!currentId) {
      setFavorite(false);
      return;
    }

    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) {
        setFavorite(false);
        return;
      }

      const ids = new Set(JSON.parse(raw) as string[]);
      setFavorite(ids.has(currentId));
    } catch {
      setFavorite(false);
    }
  }, [data?.current?.id]);

  if (loading && !data) {
    return <p className="status-text story-status">照片故事加载中...</p>;
  }

  if (!data) {
    return (
      <section className="story-fallback">
        <p className="status-text error">加载失败：{error ?? "照片不存在"}</p>
        <Link className="ghost-link" to="/">
          返回主页
        </Link>
      </section>
    );
  }

  const storyData = data;
  const photo = storyData.current;
  const rawTitle = photo.title?.trim() ?? "";
  const photoTags = Array.isArray(photo.tags) ? photo.tags : [];

  function setFavoriteForPhoto(next: boolean): void {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const ids = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
      if (next) {
        ids.add(photo.id);
      } else {
        ids.delete(photo.id);
      }
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore localStorage failures
    }
  }

  function handleToggleFavorite(): void {
    const next = !favorite;
    setFavorite(next);
    setFavoriteForPhoto(next);
    setActionMessage(next ? "已加入收藏" : "已取消收藏");
  }

  async function handleShare(): Promise<void> {
    const shareUrl = `${window.location.origin}/story/${photo.id}`;
    const shareText = rawTitle ? `和你分享一张照片：${rawTitle}` : "和你分享一张照片";

    if (navigator.share) {
      try {
        await navigator.share({
          title: rawTitle || "照片",
          text: shareText,
          url: shareUrl
        });
        setActionMessage("已打开系统分享面板");
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setActionMessage("分享链接已复制到剪贴板");
    } catch {
      setActionMessage("复制失败，请手动复制地址栏链接");
    }
  }

  function handlePrint(): void {
    window.print();
  }

  async function handleDelete(): Promise<void> {
    if (deleting) {
      return;
    }

    const ok = window.confirm("确认删除这张照片吗？删除后不可恢复。");
    if (!ok) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await deletePhoto(photo.id);
      const next = storyData.nextId ?? storyData.prevId;
      navigate(next ? `/story/${next}` : "/", { replace: true });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="story-shell">
      <header className="story-topbar glass-nav">
        <div className="story-topbar-left">
          <Link to="/" className="icon-pill">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1>时光档案馆</h1>
        </div>

        <div className="story-topbar-actions">
          <button type="button" onClick={handleToggleFavorite}>
            <span className={favorite ? "material-symbols-outlined favorite-filled" : "material-symbols-outlined"}>
              favorite
            </span>
            {favorite ? "已收藏" : "收藏"}
          </button>
          <button type="button" onClick={() => void handleShare()}>
            <span className="material-symbols-outlined">share</span>
            分享
          </button>
          <button
            type="button"
            className="danger-icon"
            aria-label="delete"
            title={deleting ? "删除中..." : "删除照片"}
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </header>

      <main className="story-main">
        <section className="story-image-stage">
          <div className="story-image-frame">
            <img src={photo.url} alt={rawTitle || "照片"} className="story-image" />
            <span className="floating-date">{new Date(photo.capturedAt).toLocaleDateString("zh-CN")}</span>
          </div>

          <div className="story-nav-arrows">
            {storyData.prevId ? (
              <Link to={"/story/" + storyData.prevId} className="story-arrow">
                <span className="material-symbols-outlined">chevron_left</span>
              </Link>
            ) : (
              <span className="story-arrow disabled">
                <span className="material-symbols-outlined">chevron_left</span>
              </span>
            )}

            {storyData.nextId ? (
              <Link to={"/story/" + storyData.nextId} className="story-arrow">
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            ) : (
              <span className="story-arrow disabled">
                <span className="material-symbols-outlined">chevron_right</span>
              </span>
            )}
          </div>
        </section>

        <aside className="story-panel">
          {loading ? <p className="status-text">正在切换到下一张...</p> : null}
          {error ? <p className="status-text error">切换失败：{error}</p> : null}
          {deleteError ? <p className="status-text error">{deleteError}</p> : null}
          {actionMessage ? <p className="status-text">{actionMessage}</p> : null}

          <section className="story-header">
            <span className="story-eyebrow">背景故事</span>
            {rawTitle ? <h2>{rawTitle}</h2> : null}
            <p>{photo.description ?? "为了捕捉这一刻，你可以在这里补充完整的照片故事。"}</p>
          </section>

          <section className="meta-grid story-meta-grid">
            <div>
              <span>拍摄时间</span>
              <strong>{new Date(photo.capturedAt).toLocaleString("zh-CN")}</strong>
            </div>
            <div>
              <span>所属阶段</span>
              <strong>{photo.stage ?? "未分组"}</strong>
            </div>
            <div>
              <span>标签</span>
              <strong>{photoTags.length ? photoTags.join(" / ") : "暂无"}</strong>
            </div>
          </section>

          <section className="story-tag-block">
            <h3>所属相册</h3>
            <div className="chip-row">
              <span className="chip chip-soft">{photo.stage ?? "未分组"}</span>
              <button type="button" className="chip" onClick={() => navigate("/albums")}>
                添加到相册
              </button>
            </div>
          </section>

          <section className="story-tag-block">
            <h3>标签</h3>
            <div className="chip-row">
              {photoTags.length ? photoTags.map((tag) => <span key={tag} className="chip chip-soft">#{tag}</span>) : <span>暂无标签</span>}
            </div>
          </section>

          <button type="button" className="print-btn" onClick={handlePrint}>
            <span className="material-symbols-outlined">print</span>
            打印照片
          </button>
        </aside>
      </main>

      {storyData.related.length ? (
        <div className="story-related-float">
          <span>更多相似照片</span>
          <div className="related-avatar-row">
            {storyData.related.slice(0, 3).map((item) => (
              <Link key={item.id} to={"/story/" + item.id}>
                <img src={item.url} alt={getPhotoTitle(item.title)} />
              </Link>
            ))}
          </div>
          {storyData.related[0] ? (
            <Link to={"/story/" + storyData.related[0].id} className="ghost-link">
              <span className="material-symbols-outlined">arrow_forward_ios</span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
