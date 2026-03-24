import { useState } from "react";
import type { CreatePhotoInput } from "@timeline/shared";

interface PhotoUploadFormProps {
  onCreate: (payload: CreatePhotoInput) => Promise<void>;
}

interface FormState {
  title: string;
  description: string;
  url: string;
  capturedAt: string;
  stage: string;
  tags: string;
}

const initialState: FormState = {
  title: "",
  description: "",
  url: "",
  capturedAt: "",
  stage: "",
  tags: ""
};

export function PhotoUploadForm({ onCreate }: PhotoUploadFormProps) {
  const [state, setState] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onCreate({
        title: state.title.trim() || undefined,
        description: state.description || undefined,
        url: state.url,
        capturedAt: new Date(state.capturedAt).toISOString(),
        stage: state.stage || undefined,
        tags: state.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      });

      setState(initialState);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel upload-form" onSubmit={handleSubmit}>
      <h2>新增照片</h2>
      <div className="form-grid">
        <label>
          标题（可选）
          <input
            value={state.title}
            onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="例如：第一次露营（可留空）"
          />
        </label>

        <label>
          图片 URL
          <input
            required
            type="url"
            value={state.url}
            onChange={(event) => setState((prev) => ({ ...prev, url: event.target.value }))}
            placeholder="https://..."
          />
        </label>

        <label>
          拍摄时间
          <input
            required
            type="datetime-local"
            value={state.capturedAt}
            onChange={(event) => setState((prev) => ({ ...prev, capturedAt: event.target.value }))}
          />
        </label>

        <label>
          阶段
          <input
            value={state.stage}
            onChange={(event) => setState((prev) => ({ ...prev, stage: event.target.value }))}
            placeholder="例如：大学 / 工作 / 家庭"
          />
        </label>

        <label className="span-2">
          标签（逗号分隔）
          <input
            value={state.tags}
            onChange={(event) => setState((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="旅行, 家人, 里程碑"
          />
        </label>

        <label className="span-2">
          描述
          <textarea
            value={state.description}
            onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="记录照片背后的故事..."
          />
        </label>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "提交中..." : "保存照片"}
      </button>
    </form>
  );
}
