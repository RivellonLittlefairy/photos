import { Link } from "react-router-dom";

interface EmptyArchiveStateProps {
  title: string;
  description: string;
}

export function EmptyArchiveState({ title, description }: EmptyArchiveStateProps) {
  return (
    <section className="empty-archive-state">
      <div className="empty-archive-icon">
        <span className="material-symbols-outlined">photo_library</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="empty-archive-actions">
        <Link to="/upload" className="primary-btn">
          <span className="material-symbols-outlined">add</span>
          上传第一张照片
        </Link>
        <Link to="/albums" className="ghost-btn">
          去相册页
        </Link>
      </div>
    </section>
  );
}
