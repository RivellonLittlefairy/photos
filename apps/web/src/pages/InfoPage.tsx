import { Link } from "react-router-dom";

interface InfoPageProps {
  title: string;
  description: string;
  sections: Array<{ heading: string; content: string }>;
}

export function InfoPage({ title, description, sections }: InfoPageProps) {
  return (
    <section className="page-shell info-page">
      <header className="editorial-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <article className="info-page-content">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.content}</p>
          </section>
        ))}
      </article>

      <Link to="/" className="ghost-btn">
        返回时间轴
      </Link>
    </section>
  );
}
