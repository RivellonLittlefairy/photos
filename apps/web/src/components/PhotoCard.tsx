import type { Photo } from "@timeline/shared";
import { getPhotoTitle } from "../utils/photo";

interface PhotoCardProps {
  photo: Photo;
  onDelete: (id: string) => Promise<void>;
}

export function PhotoCard({ photo, onDelete }: PhotoCardProps) {
  const title = getPhotoTitle(photo.title);

  return (
    <article className="photo-card">
      <img src={photo.url} alt={title} loading="lazy" />
      <div className="photo-meta">
        <header>
          <h3>{title}</h3>
          <time>{new Date(photo.capturedAt).toLocaleString("zh-CN")}</time>
        </header>

        {photo.description ? <p>{photo.description}</p> : null}

        <div className="chips">
          {photo.stage ? <span className="chip">{photo.stage}</span> : null}
          {photo.tags.map((tag) => (
            <span className="chip" key={tag}>
              #{tag}
            </span>
          ))}
        </div>

        <button className="danger" onClick={() => void onDelete(photo.id)}>
          删除
        </button>
      </div>
    </article>
  );
}
